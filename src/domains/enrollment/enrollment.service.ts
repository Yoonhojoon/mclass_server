import { PrismaClient, EnrollmentStatus, Prisma } from '@prisma/client';
import { setTimeout } from 'timers/promises';
import { EnrollmentRepository } from './enrollment.repository.js';
import {
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest,
  CancelEnrollmentRequest,
  UpdateEnrollmentStatusRequest,
  EnrollmentQuery,
  AdminEnrollmentQuery,
  EnrollmentResponse,
  EnrollmentStats,
} from './enrollment.schemas.js';
import { EnrollmentError } from '../../common/exception/enrollment/EnrollmentError.js';
import { MClassRepository } from '../mclass/mclass.repository.js';
import { EnrollmentFormService } from '../enrollmentForm/enrollmentForm.service.js';
import { UserService } from '../user/user.service.js';
import { EnrollmentEmailService } from '../../services/email/enrollment.email.service.js';
import { EmailOutboxWorker } from '../../services/email/email-outbox.worker.js';
import logger from '../../config/logger.config.js';

export class EnrollmentService {
  constructor(
    private prisma: PrismaClient,
    private repository: EnrollmentRepository,
    private mclassRepository: MClassRepository,
    private enrollmentFormService: EnrollmentFormService,
    private userService: UserService,
    private enrollmentEmailService: EnrollmentEmailService,
    private emailOutboxWorker: EmailOutboxWorker
  ) {}

  /**
   * 재시도 정책을 위한 헬퍼 메서드
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const err = (error ?? {}) as {
          code?: string;
          meta?: { code?: string };
          message?: string;
        };
        // Postgres SQLSTATE: 40001 = serialization_failure, 40P01 = deadlock_detected
        if (
          err.code === 'P2034' ||
          err.code === 'P2035' ||
          err.meta?.code === '40001' ||
          err.meta?.code === '40P01'
        ) {
          logger.warn(
            `동시성 충돌 발생, 재시도 중... (${attempt}/${maxRetries})`,
            {
              error: lastError.message,
              prismaCode: err.code,
              dbCode: err.meta?.code,
            }
          );

          if (attempt < maxRetries) {
            // 지수 백오프: 100ms, 200ms, 400ms
            await setTimeout(100 * Math.pow(2, attempt - 1));
            continue;
          }
        }

        throw error;
      }
    }

    throw lastError || new Error('Unknown error occurred');
  }

  /**
   * 클래스 신청 (동시성 처리 포함)
   *
   * 신청 처리 흐름:
   * 1. 멱등성 체크 (중복 신청 방지)
   * 2. 클래스 정보 조회 및 검증
   * 3. 기존 신청 확인 (중복 신청 방지)
   * 4. 모집 기간 및 정원 체크
   * 5. 답변 검증
   * 6. 상태 결정 (APPLIED/APPROVED/WAITLISTED)
   * 7. 신청 생성
   */
  async enrollToClass(
    mclassId: string,
    data: CreateEnrollmentRequest,
    userId: string
  ): Promise<EnrollmentResponse> {
    return await this.withRetry(async () => {
      const enrollment = await this.prisma.$transaction(async tx => {
        // 1) 멱등성 체크 (중복 신청 방지)
        if (data.idempotencyKey) {
          const existing = await tx.enrollment.findFirst({
            where: { idempotencyKey: data.idempotencyKey },
          });
          if (existing) {
            logger.info('멱등성 키로 인한 중복 요청 감지', {
              idempotencyKey: data.idempotencyKey,
            });
            return existing as unknown as EnrollmentResponse;
          }
        }

        // 2) 클래스 정보 조회 및 검증 (FOR UPDATE로 잠금)
        const mclass = await this.repository.findMclassWithLock(mclassId);

        if (!mclass) {
          throw new EnrollmentError('존재하지 않는 클래스입니다.');
        }

        if (mclass.visibility !== 'PUBLIC') {
          throw new EnrollmentError('신청할 수 없는 클래스입니다.');
        }

        // 3) 신청 기간 체크
        const now = new Date();
        if (now < mclass.recruitStartAt || now > mclass.recruitEndAt) {
          throw new EnrollmentError('신청 기간이 아닙니다.');
        }

        // 4) 신청서 존재 여부 체크
        if (!mclass.enrollmentForm || !mclass.enrollmentForm.isActive) {
          throw new EnrollmentError('신청서가 준비되지 않았습니다.');
        }

        // 5) 중복 신청 체크
        const existingEnrollment = await tx.enrollment.findUnique({
          where: { userId_mclassId: { userId, mclassId } },
        });
        if (existingEnrollment) {
          throw new EnrollmentError('이미 신청한 클래스입니다.');
        }

        // 6) 답변 검증 (기본 검증만, 상세 검증은 별도 메서드로)
        this.validateAnswers(
          data.answers,
          mclass.enrollmentForm.questions as unknown as Record<string, unknown>
        );

        // 7) 현재 승인 수 집계
        const approvedCount = await tx.enrollment.count({
          where: { mclassId, status: 'APPROVED' },
        });

        // 8) 상태 결정 (선착순 또는 대기열)
        let status: EnrollmentStatus = 'APPLIED';
        if (
          mclass.selectionType === 'FIRST_COME' &&
          approvedCount < (mclass.capacity || 0)
        ) {
          // 선착순: 정원 내면 즉시 승인
          status = 'APPROVED';
        } else if (mclass.allowWaitlist && mclass.waitlistCapacity) {
          // 대기열: 대기열 정원 내면 대기 상태
          const waitlistCount = await tx.enrollment.count({
            where: { mclassId, status: 'WAITLISTED' },
          });
          if (waitlistCount < mclass.waitlistCapacity) {
            status = 'WAITLISTED';
          }
        }

        // 9) 신청 생성 (결정된 상태로 저장)
        const enrollment = await tx.enrollment.create({
          data: {
            userId,
            mclassId,
            enrollmentFormId: mclass.enrollmentForm.id,
            answers: data.answers,
            idempotencyKey: data.idempotencyKey,
            status, // 결정된 상태를 명시적으로 저장
          },
          include: {
            mclass: true,
            enrollmentForm: true,
            user: true,
          },
        });

        logger.info('Enrollment 생성 완료', {
          enrollmentId: enrollment.id,
          status,
          userId,
          mclassId,
        });

        return enrollment as unknown as EnrollmentResponse;
      });

      // 트랜잭션 성공 후 이메일 발송
      this.sendEnrollmentConfirmationEmail(enrollment.id).catch(error => {
        logger.error('신청 완료 이메일 발송 실패', {
          enrollmentId: enrollment.id,
          error: error instanceof Error ? error.message : String(error),
        });
      });

      return enrollment;
    });
  }

  /**
   * 내 신청 목록 조회
   */
  async getMyEnrollments(
    userId: string,
    query: EnrollmentQuery
  ): Promise<{
    enrollments: EnrollmentResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    const [enrollments, total] = await Promise.all([
      this.repository.findByUserId(userId, {
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      enrollments: enrollments as EnrollmentResponse[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 내 신청 상세 조회
   */
  async getMyEnrollment(
    enrollmentId: string,
    userId: string
  ): Promise<EnrollmentResponse> {
    const enrollment = await this.repository.findById(enrollmentId);

    if (!enrollment) {
      throw new EnrollmentError('존재하지 않는 신청입니다.');
    }

    if (enrollment.userId !== userId) {
      throw new EnrollmentError('접근 권한이 없습니다.');
    }

    return enrollment as unknown as EnrollmentResponse;
  }

  /**
   * 관리자용 신청 상세 조회 (소유권 검사 없음)
   */
  async getEnrollmentByIdForAdmin(
    enrollmentId: string
  ): Promise<EnrollmentResponse> {
    const enrollment = await this.repository.findById(enrollmentId);
    if (!enrollment) {
      throw new EnrollmentError('존재하지 않는 신청입니다.');
    }
    return enrollment as unknown as EnrollmentResponse;
  }

  /**
   * 신청 취소
   *
   * 취소 가능한 상태: APPLIED, WAITLISTED, APPROVED
   * 대기자 승격: 승인 상태에서 취소된 경우에만 실행 (APPROVED → CANCELED)
   */
  async cancelEnrollment(
    enrollmentId: string,
    userId: string,
    data: CancelEnrollmentRequest
  ): Promise<EnrollmentResponse> {
    return await this.withRetry(async () => {
      const updatedEnrollment = await this.prisma.$transaction(async tx => {
        const enrollment = await tx.enrollment.findUnique({
          where: { id: enrollmentId },
          include: { mclass: true },
        });

        if (!enrollment) {
          throw new EnrollmentError('존재하지 않는 신청입니다.');
        }

        if (enrollment.userId !== userId) {
          throw new EnrollmentError('접근 권한이 없습니다.');
        }

        // 취소 가능한 상태인지 확인 (승인 상태도 취소 가능)
        const cancellableStatuses: EnrollmentStatus[] = [
          'APPLIED',
          'WAITLISTED',
          'APPROVED',
        ];
        if (!cancellableStatuses.includes(enrollment.status)) {
          throw new EnrollmentError('취소할 수 없는 상태입니다.');
        }

        // 취소 전 상태 저장 (대기자 승격 로직에서 사용)
        const previousStatus = enrollment.status;

        // 신청 취소
        const updatedEnrollment = await tx.enrollment.update({
          where: { id: enrollmentId },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
            reason: data.reason,
            reasonType: 'CANCEL',
            updatedAt: new Date(),
          },
          include: {
            mclass: true,
            enrollmentForm: true,
            user: true,
          },
        });

        // 대기자 승격 처리: 승인 상태에서 취소된 경우에만 실행
        // (승인 건이 줄어드는 전이: APPROVED → CANCELED)
        if (previousStatus === 'APPROVED' && enrollment.mclass.allowWaitlist) {
          await this.promoteWaitlistInTransaction(tx, enrollment.mclassId);
        }

        logger.info('Enrollment 취소 완료', {
          enrollmentId,
          userId,
          reason: data.reason,
        });

        return updatedEnrollment as unknown as EnrollmentResponse;
      });

      // 트랜잭션 성공 후 이메일 발송
      this.sendCancellationEmail(enrollmentId).catch(error => {
        logger.error('신청 취소 이메일 발송 실패', {
          enrollmentId,
          error: error instanceof Error ? error.message : String(error),
        });
      });

      return updatedEnrollment;
    });
  }

  /**
   * 신청 수정
   */
  async updateEnrollment(
    enrollmentId: string,
    data: UpdateEnrollmentRequest,
    userId: string
  ): Promise<EnrollmentResponse> {
    const enrollment = await this.repository.findById(enrollmentId);

    if (!enrollment) {
      throw new EnrollmentError('존재하지 않는 신청입니다.');
    }

    if (enrollment.userId !== userId) {
      throw new EnrollmentError('접근 권한이 없습니다.');
    }

    if (enrollment.status !== 'APPLIED') {
      throw new EnrollmentError('수정할 수 없는 상태입니다.');
    }

    // 답변 검증 - enrollmentForm 정보를 별도로 조회
    const enrollmentForm = await this.enrollmentFormService.findByMClassId(
      enrollment.mclassId
    );
    if (enrollmentForm?.questions) {
      this.validateAnswers(
        data.answers,
        enrollmentForm.questions as unknown as Record<string, unknown>
      );
    }

    // 낙관적 락으로 업데이트
    const updatedEnrollment = await this.repository.updateWithVersion(
      enrollmentId,
      { answers: data.answers },
      enrollment.version
    );

    logger.info('Enrollment 수정 완료', { enrollmentId, userId });

    return updatedEnrollment as unknown as EnrollmentResponse;
  }

  /**
   * 관리자: 신청 상태 변경
   *
   * 대기자 승격: 승인 건이 줄어드는 전이에서만 실행
   * (예: APPROVED → REJECTED, APPROVED → CANCELED)
   * 승인할 때(WAITLISTED → APPROVED)는 승격하지 않음
   */
  async updateEnrollmentStatus(
    enrollmentId: string,
    data: UpdateEnrollmentStatusRequest,
    adminId: string
  ): Promise<EnrollmentResponse> {
    return await this.withRetry(async () => {
      const [updatedEnrollment, previousStatus] =
        await this.prisma.$transaction(async tx => {
          const enrollment = await tx.enrollment.findUnique({
            where: { id: enrollmentId },
            include: { mclass: true },
          });

          if (!enrollment) {
            throw new EnrollmentError('존재하지 않는 신청입니다.');
          }

          // 승인 시 정원 체크 (클래스 정보 잠금)
          if (data.status === 'APPROVED') {
            const mclass = await this.repository.findMclassBasicWithLock(
              enrollment.mclassId
            );
            if (!mclass) {
              throw new EnrollmentError('클래스 정보를 찾을 수 없습니다.');
            }

            const approvedCount = await tx.enrollment.count({
              where: { mclassId: enrollment.mclassId, status: 'APPROVED' },
            });

            if (
              enrollment.status !== 'APPROVED' &&
              approvedCount >= (mclass.capacity || 0)
            ) {
              throw new EnrollmentError('정원이 초과되었습니다.');
            }
          }

          const updatedEnrollment = await tx.enrollment.update({
            where: { id: enrollmentId },
            data: {
              status: data.status,
              decidedAt: new Date(),
              decidedByAdminId: adminId,
              reason: data.reason,
              reasonType: data.status === 'REJECTED' ? 'REJECT' : undefined,
              updatedAt: new Date(),
            },
            include: {
              mclass: true,
              enrollmentForm: true,
              user: true,
            },
          });

          // 대기자 승격 처리: 승인 건이 줄어드는 전이에서만 실행
          // (예: APPROVED → REJECTED, APPROVED → CANCELED)
          // 승인할 때(WAITLISTED → APPROVED)는 승격하지 않음
          if (
            enrollment.status === 'APPROVED' &&
            (data.status === 'REJECTED' || data.status === 'CANCELED') &&
            enrollment.mclass.allowWaitlist
          ) {
            await this.promoteWaitlistInTransaction(tx, enrollment.mclassId);
          }

          logger.info('Enrollment 상태 변경 완료', {
            enrollmentId,
            oldStatus: enrollment.status,
            newStatus: data.status,
            adminId,
          });

          return [
            updatedEnrollment as unknown as EnrollmentResponse,
            enrollment.status,
          ];
        });

      // 트랜잭션 성공 후 이메일 발송
      this.sendStatusChangeEmail(
        enrollmentId,
        previousStatus,
        data.reason
      ).catch(error => {
        logger.error('상태 변경 이메일 발송 실패', {
          enrollmentId,
          error: error instanceof Error ? error.message : String(error),
        });
      });

      return updatedEnrollment;
    });
  }

  /**
   * 관리자: 클래스별 신청 목록 조회
   */
  async getEnrollmentsByMclass(
    mclassId: string,
    query: AdminEnrollmentQuery
  ): Promise<{
    enrollments: EnrollmentResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { mclassId };
    if (status) {
      where.status = status;
    }
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [enrollments, total] = await Promise.all([
      this.repository.findByMclassId(mclassId, {
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      enrollments: enrollments as EnrollmentResponse[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 관리자: 신청 통계 조회
   */
  async getEnrollmentStats(mclassId: string): Promise<EnrollmentStats> {
    const stats = await this.repository.getEnrollmentStats(mclassId);
    const mclass = await this.mclassRepository.findById(mclassId);

    return {
      ...stats,
      capacity: mclass?.capacity || null,
      waitlistCapacity: mclass?.waitlistCapacity || null,
    };
  }

  /**
   * 답변 검증
   */
  private validateAnswers(
    answers: Record<string, unknown>,
    questions:
      | Record<string, unknown>
      | Array<{ id: string; required?: boolean; label?: string }>
  ): void {
    const isEmptyAnswer = (val: unknown): boolean => {
      if (val === null || val === undefined) return true;
      if (typeof val === 'string') return val.trim().length === 0;
      return false; // 숫자 0, 불리언 false 등은 유효 응답으로 간주
    };

    // 객체 형태(qId -> question) 또는 배열 형태([{id, ...}]) 모두 지원
    if (Array.isArray(questions)) {
      for (const q of questions) {
        if (q?.required) {
          const a = answers[q.id];
          if (isEmptyAnswer(a)) {
            throw new EnrollmentError(
              `필수 질문 '${q.label ?? q.id}'에 답변해주세요.`
            );
          }
        }
      }
      return;
    }

    for (const [questionId, question] of Object.entries(questions)) {
      if (
        question &&
        typeof question === 'object' &&
        'required' in question &&
        (question as { required: boolean }).required
      ) {
        const a = answers[questionId];
        if (isEmptyAnswer(a)) {
          const label =
            question && typeof question === 'object' && 'label' in question
              ? String((question as { label: string }).label)
              : questionId;
          throw new EnrollmentError(`필수 질문 '${label}'에 답변해주세요.`);
        }
      }
    }
    // TODO: 상세 검증 로직 추가 (타입, 길이, 패턴 등)
  }

  /**
   * 대기자 승격 처리 (트랜잭션 외부용)
   */
  private async promoteWaitlist(mclassId: string): Promise<void> {
    const oldestWaitlist = await this.repository.findOldestWaitlist(mclassId);

    if (oldestWaitlist) {
      await this.repository.updateStatus(
        oldestWaitlist.id,
        'APPROVED',
        new Date(),
        'system', // 자동 승격이므로 시스템 식별자 사용
        '대기자 자동 승격'
      );

      logger.info('대기자 승격 완료', {
        enrollmentId: oldestWaitlist.id,
        mclassId,
      });
    }
  }

  /**
   * 대기자 승격 처리 (트랜잭션 내부용)
   */
  private async promoteWaitlistInTransaction(
    tx: Prisma.TransactionClient,
    mclassId: string
  ): Promise<void> {
    const oldestWaitlist = await tx.enrollment.findFirst({
      where: {
        mclassId,
        status: 'WAITLISTED',
      },
      orderBy: { appliedAt: 'asc' },
    });

    if (oldestWaitlist) {
      await tx.enrollment.update({
        where: { id: oldestWaitlist.id },
        data: {
          status: 'APPROVED',
          decidedAt: new Date(),
          decidedByAdminId: 'system', // 자동 승격이므로 시스템 식별자 사용
          reason: '대기자 자동 승격',
          updatedAt: new Date(),
        },
      });

      logger.info('대기자 승격 완료 (트랜잭션 내부)', {
        enrollmentId: oldestWaitlist.id,
        mclassId,
      });

      // 대기자 승인 이메일 발송
      await this.sendWaitlistApprovalEmail(oldestWaitlist.id);
    }
  }

  // ==================== 이메일 알림 메서드들 ====================

  /**
   * 신청 완료 이메일 발송
   */
  private async sendEnrollmentConfirmationEmail(
    enrollmentId: string
  ): Promise<void> {
    try {
      const enrollment = await this.repository.findById(enrollmentId);
      if (!enrollment) {
        logger.warn(
          `신청 완료 이메일 발송 실패: enrollment ${enrollmentId}를 찾을 수 없음`
        );
        return;
      }

      const [user, mclass] = await Promise.all([
        this.userService.findById(enrollment.userId),
        this.mclassRepository.findById(enrollment.mclassId),
      ]);

      if (!user || !mclass) {
        logger.warn(
          `신청 완료 이메일 발송 실패: user 또는 mclass를 찾을 수 없음`,
          {
            enrollmentId,
            userId: enrollment.userId,
            mclassId: enrollment.mclassId,
          }
        );
        return;
      }

      // 이메일 아웃박스에 추가 (비동기 발송)
      await this.emailOutboxWorker.addToOutbox({
        to: user.email,
        template: 'enrollment-status',
        payload: {
          enrollmentId: enrollment.id,
          mclassTitle: mclass.title,
          status: this.getStatusText(enrollment.status),
          appliedAt: enrollment.appliedAt.toLocaleString('ko-KR'),
          userName: user.name,
        },
        type: 'ENROLLMENT_APPLIED',
      });

      logger.info(`신청 완료 이메일 아웃박스에 추가됨: ${user.email}`, {
        enrollmentId: enrollment.id,
        mclassTitle: mclass.title,
      });
    } catch (error) {
      logger.error(`신청 완료 이메일 발송 실패: ${enrollmentId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 상태 변경 이메일 발송
   */
  private async sendStatusChangeEmail(
    enrollmentId: string,
    previousStatus: EnrollmentStatus,
    reason?: string
  ): Promise<void> {
    try {
      const enrollment = await this.repository.findById(enrollmentId);
      if (!enrollment) {
        logger.warn(
          `상태 변경 이메일 발송 실패: enrollment ${enrollmentId}를 찾을 수 없음`
        );
        return;
      }

      const [user, mclass] = await Promise.all([
        this.userService.findById(enrollment.userId),
        this.mclassRepository.findById(enrollment.mclassId),
      ]);

      if (!user || !mclass) {
        logger.warn(
          `상태 변경 이메일 발송 실패: user 또는 mclass를 찾을 수 없음`,
          {
            enrollmentId,
            userId: enrollment.userId,
            mclassId: enrollment.mclassId,
          }
        );
        return;
      }

      // 이메일 타입 결정
      let emailType = 'ENROLLMENT_STATUS_CHANGE';
      switch (enrollment.status) {
        case 'APPROVED':
          emailType = 'ENROLLMENT_APPROVED';
          break;
        case 'REJECTED':
          emailType = 'ENROLLMENT_REJECTED';
          break;
        case 'WAITLISTED':
          emailType = 'ENROLLMENT_WAITLISTED';
          break;
        case 'CANCELED':
          emailType = 'ENROLLMENT_CANCELED';
          break;
      }

      // 이메일 아웃박스에 추가 (비동기 발송)
      await this.emailOutboxWorker.addToOutbox({
        to: user.email,
        template: 'enrollment-status-change',
        payload: {
          enrollmentId: enrollment.id,
          mclassTitle: mclass.title,
          previousStatus: this.getStatusText(previousStatus),
          currentStatus: this.getStatusText(enrollment.status),
          changedAt:
            enrollment.decidedAt?.toLocaleString('ko-KR') ||
            new Date().toLocaleString('ko-KR'),
          reason,
          userName: user.name,
        },
        type: emailType,
      });

      logger.info(`상태 변경 이메일 아웃박스에 추가됨: ${user.email}`, {
        enrollmentId: enrollment.id,
        previousStatus,
        currentStatus: enrollment.status,
      });
    } catch (error) {
      logger.error(`상태 변경 이메일 발송 실패: ${enrollmentId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 대기자 승인 이메일 발송
   */
  private async sendWaitlistApprovalEmail(enrollmentId: string): Promise<void> {
    try {
      const enrollment = await this.repository.findById(enrollmentId);
      if (!enrollment) {
        logger.warn(
          `대기자 승인 이메일 발송 실패: enrollment ${enrollmentId}를 찾을 수 없음`
        );
        return;
      }

      const [user, mclass] = await Promise.all([
        this.userService.findById(enrollment.userId),
        this.mclassRepository.findById(enrollment.mclassId),
      ]);

      if (!user || !mclass) {
        logger.warn(
          `대기자 승인 이메일 발송 실패: user 또는 mclass를 찾을 수 없음`,
          {
            enrollmentId,
            userId: enrollment.userId,
            mclassId: enrollment.mclassId,
          }
        );
        return;
      }

      // 이메일 아웃박스에 추가 (비동기 발송)
      await this.emailOutboxWorker.addToOutbox({
        to: user.email,
        template: 'waitlist-promoted',
        payload: {
          enrollmentId: enrollment.id,
          mclassTitle: mclass.title,
          approvedAt:
            enrollment.decidedAt?.toLocaleString('ko-KR') ||
            new Date().toLocaleString('ko-KR'),
          userName: user.name,
        },
        type: 'WAITLIST_PROMOTED',
      });

      logger.info(`대기자 승인 이메일 아웃박스에 추가됨: ${user.email}`, {
        enrollmentId: enrollment.id,
        mclassTitle: mclass.title,
      });
    } catch (error) {
      logger.error(`대기자 승인 이메일 발송 실패: ${enrollmentId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 신청 취소 이메일 발송
   */
  private async sendCancellationEmail(enrollmentId: string): Promise<void> {
    try {
      const enrollment = await this.repository.findById(enrollmentId);
      if (!enrollment) {
        logger.warn(
          `신청 취소 이메일 발송 실패: enrollment ${enrollmentId}를 찾을 수 없음`
        );
        return;
      }

      const [user, mclass] = await Promise.all([
        this.userService.findById(enrollment.userId),
        this.mclassRepository.findById(enrollment.mclassId),
      ]);

      if (!user || !mclass) {
        logger.warn(
          `신청 취소 이메일 발송 실패: user 또는 mclass를 찾을 수 없음`,
          {
            enrollmentId,
            userId: enrollment.userId,
            mclassId: enrollment.mclassId,
          }
        );
        return;
      }

      // 이메일 아웃박스에 추가 (비동기 발송)
      await this.emailOutboxWorker.addToOutbox({
        to: user.email,
        template: 'enrollment-cancelled',
        payload: {
          enrollmentId: enrollment.id,
          mclassTitle: mclass.title,
          cancelledAt: new Date().toLocaleString('ko-KR'),
          userName: user.name,
        },
        type: 'ENROLLMENT_CANCELED',
      });

      logger.info(`신청 취소 이메일 아웃박스에 추가됨: ${user.email}`, {
        enrollmentId: enrollment.id,
        mclassTitle: mclass.title,
      });
    } catch (error) {
      logger.error(`신청 취소 이메일 발송 실패: ${enrollmentId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 상태 텍스트 변환
   */
  private getStatusText(status: EnrollmentStatus): string {
    const statusMap: Record<EnrollmentStatus, string> = {
      APPLIED: '신청됨',
      APPROVED: '승인됨',
      REJECTED: '거절됨',
      WAITLISTED: '대기자',
      CANCELED: '취소됨',
    };

    return statusMap[status] || status;
  }
}
