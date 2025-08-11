import { Request, Response, NextFunction } from 'express';
import { EnrollmentFormService } from './enrollmentForm.service.js';
import { EnrollmentFormSuccess } from '../../common/exception/enrollment-form/EnrollmentFormSuccess.js';
import { EnrollmentFormError } from '../../common/exception/enrollment-form/EnrollmentFormError.js';
import { CreateEnrollmentFormDtoSchema } from './dto/CreateEnrollmentFormDto.js';
import { UpdateEnrollmentFormDtoSchema } from './dto/UpdateEnrollmentFormDto.js';
import { ZodError } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class EnrollmentFormController {
  constructor(private service: EnrollmentFormService) {}

  /**
   * MClass별 지원서 양식 조회
   * GET /api/mclasses/:id/enrollment-form
   */
  async getEnrollmentForm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: mclassId } = req.params;

      // 서비스 호출
      const form = await this.service.findByMClassId(mclassId);

      // 응답 전송
      const response = EnrollmentFormSuccess.retrieved(form);
      response.send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 지원서 양식 생성
   * POST /api/mclasses/:id/enrollment-form
   */
  async createEnrollmentForm(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id: mclassId } = req.params;

      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.isAdmin) {
        throw EnrollmentFormError.forbidden();
      }

      // 요청 데이터 파싱 및 검증
      const data = CreateEnrollmentFormDtoSchema.parse(req.body);

      // 서비스 호출
      const form = await this.service.create(mclassId, data);

      // 응답 전송
      const response = EnrollmentFormSuccess.created(form.id, form);
      response.send(res);
    } catch (error) {
      if (error instanceof ZodError) {
        next(EnrollmentFormError.validation((error as ZodError).issues));
      } else {
        next(error);
      }
    }
  }

  /**
   * 지원서 양식 수정
   * PATCH /api/mclasses/:id/enrollment-form
   */
  async updateEnrollmentForm(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id: mclassId } = req.params;

      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.isAdmin) {
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
      response.send(res);
    } catch (error) {
      if (error instanceof ZodError) {
        next(EnrollmentFormError.validation((error as ZodError).issues));
      } else {
        next(error);
      }
    }
  }

  /**
   * 지원서 양식 삭제
   * DELETE /api/mclasses/:id/enrollment-form
   */
  async deleteEnrollmentForm(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id: mclassId } = req.params;

      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.isAdmin) {
        throw EnrollmentFormError.forbidden();
      }

      // 먼저 MClass ID로 양식 조회
      const existingForm = await this.service.findByMClassId(mclassId);

      // 서비스 호출
      await this.service.delete(existingForm.id);

      // 응답 전송
      const response = EnrollmentFormSuccess.deleted(existingForm.id);
      response.send(res);
    } catch (error) {
      next(error);
    }
  }
}
