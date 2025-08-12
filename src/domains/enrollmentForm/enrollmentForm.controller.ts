import { Request, Response, NextFunction } from 'express';
import { EnrollmentFormService } from './enrollmentForm.service.js';
import { EnrollmentFormSuccess } from '../../common/exception/enrollment-form/EnrollmentFormSuccess.js';
import { EnrollmentFormError } from '../../common/exception/enrollment-form/EnrollmentFormError.js';
import {
  CreateEnrollmentFormDtoSchema,
  UpdateEnrollmentFormDtoSchema,
} from './enrollmentForm.schemas.js';
import { ZodError } from 'zod';
import logger from '../../config/logger.config.js';

export class EnrollmentFormController {
  constructor(private service: EnrollmentFormService) {}

  /**
   * MClass별 지원서 양식 조회
   * GET /api/mclasses/:id/enrollment-form
   */
  async getEnrollmentForm(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { id: mclassId } = req.params;
    logger.info(
      `[EnrollmentFormController] MClass별 지원서 양식 조회 요청: ${mclassId}`
    );

    try {
      // 서비스 호출
      const form = await this.service.findByMClassId(mclassId);

      // 응답 전송
      const response = EnrollmentFormSuccess.retrieved(form);
      logger.info(
        `[EnrollmentFormController] MClass별 지원서 양식 조회 성공: ${mclassId}`
      );
      response.send(res);
    } catch (error) {
      logger.error(
        `[EnrollmentFormController] MClass별 지원서 양식 조회 실패: ${mclassId}`,
        { error: error instanceof Error ? error.message : error }
      );
      next(error);
    }
  }

  /**
   * 지원서 양식 생성
   * POST /api/mclasses/:id/enrollment-form
   */
  async createEnrollmentForm(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { id: mclassId } = req.params;
    const userId = req.user?.userId;
    logger.info(
      `[EnrollmentFormController] 지원서 양식 생성 요청: MClass ID ${mclassId}, 사용자 ID ${userId}`
    );

    try {
      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.isAdmin) {
        logger.warn(
          `[EnrollmentFormController] 권한 없음 - 지원서 양식 생성 시도: MClass ID ${mclassId}, 사용자 ID ${userId}`
        );
        throw EnrollmentFormError.forbidden();
      }

      // 요청 데이터 파싱 및 검증
      const data = CreateEnrollmentFormDtoSchema.parse(req.body);

      // 서비스 호출
      const form = await this.service.create(mclassId, data);

      // 응답 전송
      const response = EnrollmentFormSuccess.created(form.id, form);
      logger.info(
        `[EnrollmentFormController] 지원서 양식 생성 성공: MClass ID ${mclassId}, 양식 ID ${form.id}, 사용자 ID ${userId}`
      );
      response.send(res);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(
          `[EnrollmentFormController] 지원서 양식 생성 검증 실패: MClass ID ${mclassId}, 사용자 ID ${userId}`,
          { error: error.issues }
        );
        next(EnrollmentFormError.validation((error as ZodError).issues));
      } else {
        logger.error(
          `[EnrollmentFormController] 지원서 양식 생성 실패: MClass ID ${mclassId}, 사용자 ID ${userId}`,
          { error: error instanceof Error ? error.message : error }
        );
        next(error);
      }
    }
  }

  /**
   * 지원서 양식 수정
   * PATCH /api/mclasses/:id/enrollment-form
   */
  async updateEnrollmentForm(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { id: mclassId } = req.params;
    const userId = req.user?.userId;
    logger.info(
      `[EnrollmentFormController] 지원서 양식 수정 요청: MClass ID ${mclassId}, 사용자 ID ${userId}`
    );

    try {
      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.isAdmin) {
        logger.warn(
          `[EnrollmentFormController] 권한 없음 - 지원서 양식 수정 시도: MClass ID ${mclassId}, 사용자 ID ${userId}`
        );
        throw EnrollmentFormError.forbidden();
      }

      // 요청 데이터 파싱 및 검증
      const data = UpdateEnrollmentFormDtoSchema.parse(req.body);

      // 먼저 MClass ID로 양식 조회
      const existingForm = await this.service.findByMClassId(mclassId);

      // 서비스 호출
      const form = await this.service.update(existingForm.id, data);

      // 응답 전송
      const response = EnrollmentFormSuccess.updated(form.id, form);
      logger.info(
        `[EnrollmentFormController] 지원서 양식 수정 성공: MClass ID ${mclassId}, 양식 ID ${form.id}, 사용자 ID ${userId}`
      );
      response.send(res);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(
          `[EnrollmentFormController] 지원서 양식 수정 검증 실패: MClass ID ${mclassId}, 사용자 ID ${userId}`,
          { error: error.issues }
        );
        next(EnrollmentFormError.validation((error as ZodError).issues));
      } else {
        logger.error(
          `[EnrollmentFormController] 지원서 양식 수정 실패: MClass ID ${mclassId}, 사용자 ID ${userId}`,
          { error: error instanceof Error ? error.message : error }
        );
        next(error);
      }
    }
  }

  /**
   * 지원서 양식 삭제
   * DELETE /api/mclasses/:id/enrollment-form
   */
  async deleteEnrollmentForm(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { id: mclassId } = req.params;
    const userId = req.user?.userId;
    logger.info(
      `[EnrollmentFormController] 지원서 양식 삭제 요청: MClass ID ${mclassId}, 사용자 ID ${userId}`
    );

    try {
      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.isAdmin) {
        logger.warn(
          `[EnrollmentFormController] 권한 없음 - 지원서 양식 삭제 시도: MClass ID ${mclassId}, 사용자 ID ${userId}`
        );
        throw EnrollmentFormError.forbidden();
      }

      // 먼저 MClass ID로 양식 조회
      const existingForm = await this.service.findByMClassId(mclassId);

      // 서비스 호출
      await this.service.delete(existingForm.id);

      // 응답 전송
      const response = EnrollmentFormSuccess.deleted(existingForm.id);
      logger.info(
        `[EnrollmentFormController] 지원서 양식 삭제 성공: MClass ID ${mclassId}, 양식 ID ${existingForm.id}, 사용자 ID ${userId}`
      );
      response.send(res);
    } catch (error) {
      logger.error(
        `[EnrollmentFormController] 지원서 양식 삭제 실패: MClass ID ${mclassId}, 사용자 ID ${userId}`,
        { error: error instanceof Error ? error.message : error }
      );
      next(error);
    }
  }
}
