import { Request, Response } from 'express';
import { EnrollmentService } from './enrollment.service.js';
import {
  CreateEnrollmentSchema,
  UpdateEnrollmentSchema,
  CancelEnrollmentSchema,
  UpdateEnrollmentStatusSchema,
  EnrollmentQuerySchema,
  AdminEnrollmentQuerySchema,
} from './enrollment.schemas.js';
import { EnrollmentError } from '../../common/exception/enrollment/EnrollmentError.js';
import { EnrollmentSuccess } from '../../common/exception/enrollment/EnrollmentSuccess.js';
import logger from '../../config/logger.config.js';

export class EnrollmentController {
  constructor(private service: EnrollmentService) {}

  /**
   * 클래스 신청
   * POST /api/mclasses/:mclassId/enrollments
   */
  async enrollToClass(req: Request, res: Response): Promise<void> {
    try {
      const mclassId = req.params.mclassId;
      const userId = req.user?.userId;

      if (!userId) {
        throw new EnrollmentError('로그인이 필요합니다.');
      }

      // 요청 데이터 검증
      const validatedData = CreateEnrollmentSchema.parse(req.body);

      // 멱등성 키 생성 (헤더에서 가져오거나 자동 생성)
      const idempotencyKey =
        (req.headers['idempotency-key'] as string) ||
        validatedData.idempotencyKey ||
        `${userId}-${mclassId}-${Date.now()}`;

      const enrollment = await this.service.enrollToClass(
        mclassId,
        { ...validatedData, idempotencyKey },
        userId
      );

      logger.info('클래스 신청 성공', {
        userId,
        mclassId,
        enrollmentId: enrollment.id,
      });

      res
        .status(201)
        .json(
          EnrollmentSuccess.enrollmentSuccess(
            '클래스',
            enrollment.id,
            enrollment
          )
        );
    } catch (error) {
      logger.error('클래스 신청 실패', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 내 신청 목록 조회
   * GET /api/enrollments/my
   */
  async getMyEnrollments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new EnrollmentError('로그인이 필요합니다.');
      }

      // 쿼리 파라미터 검증
      const query = EnrollmentQuerySchema.parse(req.query);

      const result = await this.service.getMyEnrollments(userId, query);

      logger.info('내 신청 목록 조회 성공', {
        userId,
        count: result.enrollments.length,
      });

      res.json(
        EnrollmentSuccess.enrollmentListGetSuccess(
          result.enrollments.length,
          result.enrollments
        )
      );
    } catch (error) {
      logger.error('내 신청 목록 조회 실패', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 내 신청 상세 조회
   * GET /api/enrollments/my/:enrollmentId
   */
  async getMyEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const enrollmentId = req.params.enrollmentId;
      const userId = req.user?.userId;

      if (!userId) {
        throw new EnrollmentError('로그인이 필요합니다.');
      }

      const enrollment = await this.service.getMyEnrollment(
        enrollmentId,
        userId
      );

      logger.info('내 신청 상세 조회 성공', { userId, enrollmentId });

      res.json(EnrollmentSuccess.enrollmentDetailsGetSuccess(enrollment));
    } catch (error) {
      logger.error('내 신청 상세 조회 실패', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 신청 취소
   * DELETE /api/enrollments/my/:enrollmentId
   */
  async cancelEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const enrollmentId = req.params.enrollmentId;
      const userId = req.user?.userId;

      if (!userId) {
        throw new EnrollmentError('로그인이 필요합니다.');
      }

      // 요청 데이터 검증
      const validatedData = CancelEnrollmentSchema.parse(req.body);

      await this.service.cancelEnrollment(enrollmentId, userId, validatedData);

      logger.info('신청 취소 성공', {
        userId,
        enrollmentId,
        reason: validatedData.reason,
      });

      res.json(EnrollmentSuccess.enrollmentCancellationSuccess('클래스'));
    } catch (error) {
      logger.error('신청 취소 실패', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 신청 수정
   * PUT /api/enrollments/my/:enrollmentId
   */
  async updateEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const enrollmentId = req.params.enrollmentId;
      const userId = req.user?.userId;

      if (!userId) {
        throw new EnrollmentError('로그인이 필요합니다.');
      }

      // 요청 데이터 검증
      const validatedData = UpdateEnrollmentSchema.parse(req.body);

      const enrollment = await this.service.updateEnrollment(
        enrollmentId,
        validatedData,
        userId
      );

      logger.info('신청 수정 성공', { userId, enrollmentId });

      res.json(EnrollmentSuccess.enrollmentUpdateSuccess(enrollment));
    } catch (error) {
      logger.error('신청 수정 실패', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 관리자: 클래스별 신청 목록 조회
   * GET /api/admin/mclasses/:mclassId/enrollments
   */
  async getEnrollmentsByMclass(req: Request, res: Response): Promise<void> {
    try {
      const mclassId = req.params.mclassId;
      const adminId = req.user?.userId;

      if (!adminId || !req.user?.isAdmin) {
        throw new EnrollmentError('관리자 권한이 필요합니다.');
      }

      // 쿼리 파라미터 검증
      const query = AdminEnrollmentQuerySchema.parse(req.query);

      const result = await this.service.getEnrollmentsByMclass(mclassId, query);

      logger.info('관리자 신청 목록 조회 성공', {
        adminId,
        mclassId,
        count: result.enrollments.length,
      });

      res.json(
        EnrollmentSuccess.enrollmentListGetSuccess(
          result.enrollments.length,
          result.enrollments
        )
      );
    } catch (error) {
      logger.error('관리자 신청 목록 조회 실패', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 관리자: 신청 상태 변경
   * PATCH /api/admin/enrollments/:enrollmentId/status
   */
  async updateEnrollmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const enrollmentId = req.params.enrollmentId;
      const adminId = req.user?.userId;

      if (!adminId || !req.user?.isAdmin) {
        throw new EnrollmentError('관리자 권한이 필요합니다.');
      }

      // 요청 데이터 검증
      const validatedData = UpdateEnrollmentStatusSchema.parse(req.body);

      await this.service.updateEnrollmentStatus(
        enrollmentId,
        validatedData,
        adminId
      );

      logger.info('관리자 신청 상태 변경 성공', {
        adminId,
        enrollmentId,
        newStatus: validatedData.status,
      });

      res.json(
        EnrollmentSuccess.enrollmentStatusUpdateSuccess(validatedData.status)
      );
    } catch (error) {
      logger.error('관리자 신청 상태 변경 실패', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 관리자: 신청 통계 조회
   * GET /api/admin/mclasses/:mclassId/enrollments/stats
   */
  async getEnrollmentStats(req: Request, res: Response): Promise<void> {
    try {
      const mclassId = req.params.mclassId;
      const adminId = req.user?.userId;

      if (!adminId || !req.user?.isAdmin) {
        throw new EnrollmentError('관리자 권한이 필요합니다.');
      }

      const stats = await this.service.getEnrollmentStats(mclassId);

      logger.info('관리자 신청 통계 조회 성공', { adminId, mclassId });

      res.json(
        EnrollmentSuccess.enrollmentStatsGetSuccess(
          stats.totalEnrollments,
          stats.approved,
          stats
        )
      );
    } catch (error) {
      logger.error('관리자 신청 통계 조회 실패', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 관리자: 신청 상세 조회
   * GET /api/admin/enrollments/:enrollmentId
   */
  async getEnrollmentDetail(req: Request, res: Response): Promise<void> {
    try {
      const enrollmentId = req.params.enrollmentId;
      const adminId = req.user?.userId;

      if (!adminId || !req.user?.isAdmin) {
        throw new EnrollmentError('관리자 권한이 필요합니다.');
      }

      // 관리자는 소유권 검사 없이 상세 조회 가능
      const enrollment =
        await this.service.getEnrollmentByIdForAdmin(enrollmentId);

      logger.info('관리자 신청 상세 조회 성공', { adminId, enrollmentId });

      res.json(EnrollmentSuccess.enrollmentDetailsGetSuccess(enrollment));
    } catch (error) {
      logger.error('관리자 신청 상세 조회 실패', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}
