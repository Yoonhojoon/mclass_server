import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EnrollmentService } from '../../domains/enrollment/enrollment.service.js';
import { EnrollmentError } from '../../common/exception/enrollment/EnrollmentError.js';
import { EnrollmentStatus } from '@prisma/client';
import {
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest,
  CancelEnrollmentRequest,
  UpdateEnrollmentStatusRequest,
  EnrollmentQuery,
  AdminEnrollmentQuery,
} from '../../domains/enrollment/enrollment.schemas.js';
// Repository 모킹
const mockRepository = {
  create: jest.fn(),
  findByUserId: jest.fn(),
  findByMclassId: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn(),
  updateAnswers: jest.fn(),
  updateWithVersion: jest.fn(),
  delete: jest.fn(),
  findByStatus: jest.fn(),
  countByStatus: jest.fn(),
  findByUserAndMclass: jest.fn(),
  findByUserAndMclassWithForm: jest.fn(),
  getEnrollmentStats: jest.fn(),
  findOldestWaitlist: jest.fn(),
  findMclassWithLock: jest.fn(),
  findMclassBasicWithLock: jest.fn(),
} as any;

// MClass Repository 모킹
const mockMClassRepository = {
  findById: jest.fn(),
} as any;

// EnrollmentForm Service 모킹
const mockEnrollmentFormService = {
  findByMClassId: jest.fn(),
  validateAnswers: jest.fn(),
} as any;

// User Service 모킹
const mockUserService = {
  findById: jest.fn(),
} as any;

// Email Service 모킹
const mockEnrollmentEmailService = {
  sendEnrollmentConfirmation: jest.fn(),
  sendStatusChangeNotification: jest.fn(),
  sendWaitlistApproval: jest.fn(),
  sendEnrollmentCancellation: jest.fn(),
} as any;

const mockEmailOutboxWorker = {
  addToOutbox: jest.fn(),
} as any;

// Prisma 모킹 - 완전한 모킹으로 수정
const mockPrisma = {
  $transaction: jest.fn(),
  enrollment: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  mClass: {
    findUnique: jest.fn(),
  },
} as any;

// Logger 모킹
jest.mock('../../config/logger.config.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('EnrollmentService', () => {
  let service: EnrollmentService;

  beforeEach(() => {
    service = new EnrollmentService(
      mockPrisma,
      mockRepository,
      mockMClassRepository,
      mockEnrollmentFormService,
      mockUserService,
      mockEnrollmentEmailService,
      mockEmailOutboxWorker
    );

    // sendEnrollmentConfirmationEmail 메서드를 모킹
    jest
      .spyOn(service as any, 'sendEnrollmentConfirmationEmail')
      .mockResolvedValue(undefined);
    // sendStatusChangeEmail 메서드를 모킹
    jest
      .spyOn(service as any, 'sendStatusChangeEmail')
      .mockResolvedValue(undefined);
    // sendCancellationEmail 메서드를 모킹
    jest
      .spyOn(service as any, 'sendCancellationEmail')
      .mockResolvedValue(undefined);
  });

  describe('enrollToClass', () => {
    const mockEnrollmentData: CreateEnrollmentRequest = {
      answers: {
        q1_name: '홍길동',
        q2_email: 'hong@example.com',
        q3_phone: '010-1234-5678',
        q4_birth: '1990-01-01',
        q5_motivation: '새로운 기술을 배우고 싶습니다.',
        q6_experience: ['javascript', 'react'],
        q7_agree: true,
        q8_level: 'intermediate',
      },
      idempotencyKey: 'test-key-123',
    };

    const mockMClass = {
      id: 'mclass-1',
      title: '테스트 클래스',
      capacity: 60,
      waitlistCapacity: 20,
      visibility: 'PUBLIC',
      recruitStartAt: new Date(Date.now() - 86400000), // 어제
      recruitEndAt: new Date(Date.now() + 86400000), // 내일
      selectionType: 'FIRST_COME',
      allowWaitlist: true,
      enrollmentForm: {
        id: 'form-1',
        isActive: true,
        questions: {
          q1_name: {
            id: 'q1_name',
            type: 'text',
            required: true,
            label: '이름',
          },
          q2_email: {
            id: 'q2_email',
            type: 'email',
            required: true,
            label: '이메일',
          },
        },
      },
    };

    const mockEnrollmentForm = {
      id: 'form-1',
      questions: {
        q1_name: { id: 'q1_name', type: 'text', required: true, label: '이름' },
        q2_email: {
          id: 'q2_email',
          type: 'email',
          required: true,
          label: '이메일',
        },
      },
    };

    it('클래스 신청을 성공적으로 처리한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        answers: mockEnrollmentData.answers,
        appliedAt: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockPrisma.enrollment.findFirst.mockResolvedValue(null);
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);
      mockPrisma.enrollment.count.mockResolvedValue(30); // 정원 내
      mockPrisma.enrollment.create.mockResolvedValue(mockEnrollment);
      mockPrisma.enrollment.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { status: 30 } },
        { status: 'WAITLISTED', _count: { status: 5 } },
      ]);
      mockMClassRepository.findById.mockResolvedValue(mockMClass);
      mockRepository.findMclassWithLock.mockResolvedValue(mockMClass);
      mockEnrollmentFormService.findByMClassId.mockResolvedValue(
        mockEnrollmentForm
      );
      mockEnrollmentFormService.validateAnswers.mockResolvedValue(true);

      const result = await service.enrollToClass(
        'mclass-1',
        mockEnrollmentData,
        'user-1'
      );

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.enrollment.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          mclassId: 'mclass-1',
          enrollmentFormId: 'form-1',
          answers: mockEnrollmentData.answers,
          idempotencyKey: 'test-key-123',
          status: 'APPROVED', // 선착순 방식에서 정원 내면 즉시 승인
        },
        include: {
          enrollmentForm: {
            select: {
              id: true,
              isActive: true,
              questions: true,
            },
          },
          mclass: {
            select: {
              id: true,
              title: true,
              capacity: true,
              selectionType: true,
              visibility: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(mockEnrollment);
    });

    it('멱등성 키로 인한 중복 요청을 처리한다', async () => {
      const existingEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockMClassRepository.findById.mockResolvedValue(mockMClass);
      mockPrisma.enrollment.findFirst.mockResolvedValue(existingEnrollment);
      mockPrisma.enrollment.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { status: 30 } },
        { status: 'WAITLISTED', _count: { status: 5 } },
      ]);

      const result = await service.enrollToClass(
        'mclass-1',
        mockEnrollmentData,
        'user-1'
      );

      expect(result).toEqual(existingEnrollment);
      expect(mockPrisma.enrollment.create).not.toHaveBeenCalled();
    });

    it('이미 신청한 클래스에 대해 에러를 던진다', async () => {
      const existingEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
      };

      // idempotencyKey가 없는 테스트 데이터 사용
      const testEnrollmentData = {
        answers: mockEnrollmentData.answers,
        // idempotencyKey를 명시적으로 undefined로 설정
      };

      // 트랜잭션 내부에서 사용되는 enrollment.findFirst를 모킹
      // 첫 번째 호출 (기존 신청 체크)에서는 existingEnrollment 반환
      mockPrisma.enrollment.findFirst.mockResolvedValue(existingEnrollment);

      // enrollment.groupBy도 모킹
      mockPrisma.enrollment.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { status: 30 } },
        { status: 'WAITLISTED', _count: { status: 5 } },
      ]);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockMClassRepository.findById.mockResolvedValue(mockMClass);
      mockRepository.findMclassWithLock.mockResolvedValue(mockMClass);

      await expect(
        service.enrollToClass('mclass-1', testEnrollmentData, 'user-1')
      ).rejects.toThrow(EnrollmentError);
    });

    it('신청 기간이 지난 경우 에러를 던진다', async () => {
      const expiredMClass = {
        ...mockMClass,
        recruitEndAt: new Date(Date.now() - 86400000), // 어제
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockMClassRepository.findById.mockResolvedValue(expiredMClass);
      mockPrisma.enrollment.findFirst.mockResolvedValue(null);
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);
      mockPrisma.enrollment.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { status: 30 } },
        { status: 'WAITLISTED', _count: { status: 5 } },
      ]);
      mockRepository.findMclassWithLock.mockResolvedValue(expiredMClass);

      await expect(
        service.enrollToClass('mclass-1', mockEnrollmentData, 'user-1')
      ).rejects.toThrow(EnrollmentError);
    });

    it('정원 초과 시 대기자 명단에 추가한다', async () => {
      const waitlistedEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.WAITLISTED,
        answers: mockEnrollmentData.answers,
        appliedAt: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockMClassRepository.findById.mockResolvedValue(mockMClass);
      mockPrisma.enrollment.findFirst.mockResolvedValue(null);
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);
      mockPrisma.enrollment.count
        .mockResolvedValueOnce(60) // APPROVED count (정원 초과)
        .mockResolvedValueOnce(15); // WAITLISTED count (대기자 명단 여유)
      mockPrisma.enrollment.create.mockResolvedValue(waitlistedEnrollment);
      mockPrisma.enrollment.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { status: 60 } },
        { status: 'WAITLISTED', _count: { status: 15 } },
      ]);
      mockRepository.findMclassWithLock.mockResolvedValue(mockMClass);
      mockEnrollmentFormService.findByMClassId.mockResolvedValue(
        mockEnrollmentForm
      );
      mockEnrollmentFormService.validateAnswers.mockResolvedValue(true);

      const result = await service.enrollToClass(
        'mclass-1',
        mockEnrollmentData,
        'user-1'
      );

      expect(result.status).toBe(EnrollmentStatus.WAITLISTED);
    });
  });

  describe('getMyEnrollments', () => {
    it('사용자의 신청 목록을 성공적으로 조회한다', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          userId: 'user-1',
          mclassId: 'mclass-1',
          status: EnrollmentStatus.APPLIED,
          mclass: { id: 'mclass-1', title: '클래스 1' },
          enrollmentForm: { id: 'form-1', title: '신청서 1' },
        },
      ];

      const query: EnrollmentQuery = {
        status: 'APPLIED',
        page: 1,
        limit: 10,
      };

      mockRepository.findByUserId.mockResolvedValue(mockEnrollments);
      mockPrisma.enrollment.count.mockResolvedValue(1);

      const result = await service.getMyEnrollments('user-1', query);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-1', {
        where: { userId: 'user-1', status: EnrollmentStatus.APPLIED },
        skip: 0,
        take: 10,
        orderBy: { appliedAt: 'desc' },
      });
      expect(result.enrollments).toEqual(mockEnrollments);
      expect(result.pagination).toBeDefined();
    });
  });

  describe('getMyEnrollmentById', () => {
    it('사용자의 특정 신청을 성공적으로 조회한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        mclass: { id: 'mclass-1', title: '클래스 1' },
        enrollmentForm: { id: 'form-1', title: '신청서 1' },
      };

      mockRepository.findById.mockResolvedValue(mockEnrollment);

      const result = await service.getMyEnrollment('enrollment-1', 'user-1');

      expect(mockRepository.findById).toHaveBeenCalledWith('enrollment-1');
      expect(result).toEqual(mockEnrollment);
    });

    it('다른 사용자의 신청 조회 시 에러를 던진다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-2', // 다른 사용자
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
      };

      mockRepository.findById.mockResolvedValue(mockEnrollment);

      await expect(
        service.getMyEnrollment('enrollment-1', 'user-1')
      ).rejects.toThrow(EnrollmentError);
    });
  });

  describe('cancelEnrollment', () => {
    it('신청을 성공적으로 취소한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        mclass: { allowWaitlist: false },
      };

      const cancelData: CancelEnrollmentRequest = {
        reason: '개인 사정으로 취소합니다.',
      };

      const canceledEnrollment = {
        ...mockEnrollment,
        status: EnrollmentStatus.CANCELED,
        canceledAt: new Date(),
        reason: cancelData.reason,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockPrisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockPrisma.enrollment.update.mockResolvedValue(canceledEnrollment);

      const result = await service.cancelEnrollment(
        'enrollment-1',
        'user-1',
        cancelData
      );

      expect(mockPrisma.enrollment.update).toHaveBeenCalledWith({
        where: { id: 'enrollment-1' },
        data: {
          status: 'CANCELED',
          canceledAt: expect.any(Date),
          reason: cancelData.reason,
          reasonType: 'CANCEL',
          updatedAt: expect.any(Date),
        },
        include: {
          mclass: true,
          enrollmentForm: true,
          user: true,
        },
      });
      expect(result).toEqual(canceledEnrollment);
    });

    it('이미 취소된 신청에 대해 에러를 던진다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.CANCELED,
        mclass: { allowWaitlist: false },
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockPrisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);

      await expect(
        service.cancelEnrollment('enrollment-1', 'user-1', { reason: '취소' })
      ).rejects.toThrow(EnrollmentError);
    });
  });

  describe('updateEnrollment', () => {
    it('신청 답변을 성공적으로 수정한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        version: 1,
        answers: {
          q1_name: '홍길동',
          q2_email: 'hong@example.com',
        },
      };

      const updateData: UpdateEnrollmentRequest = {
        answers: {
          q1_name: '수정된 이름',
          q2_email: 'modified@example.com',
        },
      };

      const updatedEnrollment = {
        ...mockEnrollment,
        answers: updateData.answers,
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockEnrollment);
      mockEnrollmentFormService.findByMClassId.mockResolvedValue({
        questions: {
          q1_name: {
            id: 'q1_name',
            type: 'text',
            required: true,
            label: '이름',
          },
          q2_email: {
            id: 'q2_email',
            type: 'email',
            required: true,
            label: '이메일',
          },
        },
      });
      mockRepository.updateWithVersion.mockResolvedValue(updatedEnrollment);

      const result = await service.updateEnrollment(
        'enrollment-1',
        updateData,
        'user-1'
      );

      expect(mockRepository.updateWithVersion).toHaveBeenCalledWith(
        'enrollment-1',
        { answers: updateData.answers },
        1
      );
      expect(result).toEqual(updatedEnrollment);
    });
  });

  describe('getEnrollmentsByMclass', () => {
    it('클래스별 신청 목록을 성공적으로 조회한다', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          userId: 'user-1',
          mclassId: 'mclass-1',
          status: EnrollmentStatus.APPLIED,
          user: { id: 'user-1', name: '홍길동' },
          enrollmentForm: { id: 'form-1', title: '신청서' },
        },
      ];

      const query: AdminEnrollmentQuery = {
        status: 'APPLIED',
        page: 1,
        limit: 10,
        search: '홍길동',
      };

      mockRepository.findByMclassId.mockResolvedValue(mockEnrollments);
      mockPrisma.enrollment.count.mockResolvedValue(1);

      const result = await service.getEnrollmentsByMclass('mclass-1', query);

      expect(mockRepository.findByMclassId).toHaveBeenCalledWith('mclass-1', {
        where: {
          mclassId: 'mclass-1',
          status: EnrollmentStatus.APPLIED,
          user: {
            OR: [
              { name: { contains: '홍길동', mode: 'insensitive' } },
              { email: { contains: '홍길동', mode: 'insensitive' } },
            ],
          },
        },
        skip: 0,
        take: 10,
        orderBy: { appliedAt: 'desc' },
      });
      expect(result.enrollments).toEqual(mockEnrollments);
      expect(result.pagination).toBeDefined();
    });
  });

  describe('updateEnrollmentStatus', () => {
    it('신청 상태를 성공적으로 변경한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        mclass: { capacity: 60, allowWaitlist: false },
      };

      const statusData: UpdateEnrollmentStatusRequest = {
        status: 'APPROVED',
        reason: '승인되었습니다.',
      };

      const updatedEnrollment = {
        ...mockEnrollment,
        status: EnrollmentStatus.APPROVED,
        decidedAt: new Date(),
        decidedByAdminId: 'admin-1',
        reason: statusData.reason,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockPrisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockPrisma.enrollment.count.mockResolvedValue(30); // 정원 내
      mockPrisma.enrollment.update.mockResolvedValue(updatedEnrollment);
      mockRepository.findMclassBasicWithLock.mockResolvedValue({
        id: 'mclass-1',
        capacity: 60,
        allowWaitlist: false,
      });

      const result = await service.updateEnrollmentStatus(
        'enrollment-1',
        statusData,
        'admin-1'
      );

      expect(mockPrisma.enrollment.update).toHaveBeenCalledWith({
        where: { id: 'enrollment-1' },
        data: {
          status: 'APPROVED',
          decidedAt: expect.any(Date),
          decidedByAdminId: 'admin-1',
          reason: statusData.reason,
          reasonType: undefined,
          updatedAt: expect.any(Date),
        },
        include: {
          mclass: true,
          enrollmentForm: true,
          user: true,
        },
      });
      expect(result).toEqual(updatedEnrollment);
    });
  });

  describe('getEnrollmentStats', () => {
    it('클래스별 신청 통계를 성공적으로 조회한다', async () => {
      const mockStats = {
        totalEnrollments: 100,
        applied: 20,
        approved: 50,
        rejected: 10,
        waitlisted: 15,
        canceled: 5,
      };

      const mockMClass = {
        capacity: 60,
        waitlistCapacity: 20,
      };

      mockRepository.getEnrollmentStats.mockResolvedValue(mockStats);
      mockMClassRepository.findById.mockResolvedValue(mockMClass);

      const result = await service.getEnrollmentStats('mclass-1');

      expect(mockRepository.getEnrollmentStats).toHaveBeenCalledWith(
        'mclass-1'
      );
      expect(mockMClassRepository.findById).toHaveBeenCalledWith('mclass-1');
      expect(result).toEqual({
        ...mockStats,
        capacity: 60,
        waitlistCapacity: 20,
      });
    });
  });

  describe('이메일 서비스 통합', () => {
    it('신청 완료 시 이메일 발송을 호출한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        mclass: {
          id: 'mclass-1',
          title: '테스트 클래스',
          capacity: 60,
          allowWaitlist: true,
          waitlistCapacity: 20,
        },
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: '테스트 사용자',
        },
        enrollmentForm: { id: 'form-1' },
        answers: {
          q1_name: '홍길동',
          q2_email: 'hong@example.com',
        },
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockPrisma.enrollment.findUnique.mockResolvedValue(null);
      // 정원 초과 상황 시뮬레이션
      mockPrisma.enrollment.count
        .mockResolvedValueOnce(60) // 승인된 신청이 60개 (정원 초과)
        .mockResolvedValueOnce(0); // 대기열은 비어있음
      mockPrisma.enrollment.create.mockResolvedValue(mockEnrollment);
      mockPrisma.enrollment.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { status: 60 } },
        { status: 'WAITLISTED', _count: { status: 0 } },
      ]);
      mockRepository.findById.mockResolvedValue(mockEnrollment);
      mockUserService.findById.mockResolvedValue(mockEnrollment.user);
      mockMClassRepository.findById.mockResolvedValue(mockEnrollment.mclass);

      mockMClassRepository.findById.mockResolvedValue({
        ...mockEnrollment.mclass,
        visibility: 'PUBLIC',
        recruitStartAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1일 전
        recruitEndAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1일 후
        allowWaitlist: true,
        waitlistCapacity: 20,
        enrollmentForm: {
          id: 'form-1',
          isActive: true,
          questions: {
            q1_name: { type: 'text', required: true },
            q2_email: { type: 'email', required: true },
          },
        },
      });
      mockRepository.findMclassWithLock.mockResolvedValue({
        ...mockEnrollment.mclass,
        visibility: 'PUBLIC',
        recruitStartAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1일 전
        recruitEndAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1일 후
        allowWaitlist: true,
        waitlistCapacity: 20,
        enrollmentForm: {
          id: 'form-1',
          isActive: true,
          questions: {
            q1_name: { type: 'text', required: true },
            q2_email: { type: 'email', required: true },
          },
        },
      });
      mockEnrollmentFormService.findByMClassId.mockResolvedValue({
        questions: {
          q1_name: { type: 'text', required: true },
          q2_email: { type: 'email', required: true },
        },
      });
      mockUserService.findById.mockResolvedValue(mockEnrollment.user);

      const enrollmentData: CreateEnrollmentRequest = {
        answers: mockEnrollment.answers,
        idempotencyKey: 'test-key',
      };

      await service.enrollToClass('mclass-1', enrollmentData, 'user-1');

      // sendEnrollmentConfirmationEmail 메서드가 호출되었는지 확인
      expect(service['sendEnrollmentConfirmationEmail']).toHaveBeenCalledWith(
        'enrollment-1'
      );
    });

    it('신청 취소 시 이메일 발송을 호출한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        mclass: {
          id: 'mclass-1',
          title: '테스트 클래스',
          allowWaitlist: false,
          visibility: 'PUBLIC',
          recruitStartAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          recruitEndAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: '테스트 사용자',
        },
        enrollmentForm: { id: 'form-1' },
      };

      const cancelData: CancelEnrollmentRequest = {
        reason: '개인 사정으로 취소',
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockPrisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockRepository.findById.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.CANCELED,
      });
      mockUserService.findById.mockResolvedValue(mockEnrollment.user);
      mockMClassRepository.findById.mockResolvedValue(mockEnrollment.mclass);
      mockPrisma.enrollment.update.mockResolvedValue({
        ...mockEnrollment,
        status: EnrollmentStatus.CANCELED,
      });

      await service.cancelEnrollment('enrollment-1', 'user-1', cancelData);

      // sendCancellationEmail 메서드가 호출되었는지 확인
      expect(service['sendCancellationEmail']).toHaveBeenCalledWith(
        'enrollment-1'
      );
    });
  });
});
