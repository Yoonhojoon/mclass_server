import { Request, Response } from 'express';
import { TermService } from './term.service.js';
import { TermError } from '../../common/exception/term/TermError.js';
import { ValidationError } from '../../common/exception/ValidationError.js';
import { TermSuccess } from '../../common/exception/term/TermSuccess.js';
import logger from '../../config/logger.config.js';
import {
  termResponseSchema,
  userTermAgreementResponseSchema,
} from '../../schemas/term/index.js';

// 사용자 타입 정의 - 전역 타입으로 대체됨

export class TermController {
  constructor(private readonly termService: TermService) {}

  /**
   * 모든 약관 목록 조회
   */
  async getAllTerms(req: Request, res: Response): Promise<void> {
    try {
      const terms = await this.termService.getAllTerms();
      const termDtos = terms.map(term =>
        termResponseSchema.parse({
          id: term.id,
          type: term.type,
          title: term.title,
          content: term.content,
          isRequired: term.isRequired,
          version: term.version,
          createdAt: term.createdAt.toISOString(),
        })
      );
      logger.info('✅ 모든 약관 목록 응답 성공', { count: terms.length });
      return TermSuccess.termsRetrieved(termDtos, { count: terms.length }).send(
        res
      );
    } catch (error) {
      logger.error('약관 목록 조회 중 오류 발생:', error);
      const termError = TermError.listRetrievalFailed('약관 목록 조회 실패');
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 특정 약관 조회
   */
  async getTermById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const term = await this.termService.getTermById(id);
      // Prisma 객체를 response 스키마에 맞게 변환
      const termDto = termResponseSchema.parse({
        id: term.id,
        type: term.type,
        title: term.title,
        content: term.content,
        isRequired: term.isRequired,
        version: term.version,
        createdAt: term.createdAt.toISOString(),
      });
      logger.info('✅ 특정 약관 조회 성공', {
        termId: id,
        type: term.type,
        version: term.version,
      });
      return TermSuccess.termRetrieved(termDto).send(res);
    } catch (error) {
      logger.error('약관 조회 중 오류 발생:', error);
      const termError = TermError.notFound(req.params.id);
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 약관 생성 (관리자 전용)
   */
  async createTerm(req: Request, res: Response): Promise<void> {
    try {
      const createData = req.body;
      const adminId = req.user?.userId;

      // 관리자 권한 확인
      if (!req.user?.isAdmin) {
        const error = ValidationError.forbidden('관리자 권한이 필요합니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      const term = await this.termService.createTerm({
        type: createData.type,
        title: createData.title,
        content: createData.content,
        isRequired: createData.isRequired || false,
        version: createData.version,
      });

      // Prisma 객체를 response 스키마에 맞게 변환
      const termDto = termResponseSchema.parse({
        id: term.id,
        type: term.type,
        title: term.title,
        content: term.content,
        isRequired: term.isRequired,
        version: term.version,
        createdAt: term.createdAt.toISOString(),
      });
      logger.info('✅ 약관 생성 성공', {
        termId: term.id,
        adminId,
        type: createData.type,
        version: createData.version,
      });
      return TermSuccess.termCreated(termDto).send(res);
    } catch (error) {
      logger.error('약관 생성 중 오류 발생:', error);

      // TermError인 경우 원래 에러 그대로 반환
      if (error instanceof TermError) {
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      // 기타 에러는 일반적인 생성 실패 에러로 처리
      const termError = TermError.creationFailed('약관 생성에 실패했습니다.');
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 약관 수정 (관리자 전용)
   */
  async updateTerm(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const adminId = req.user?.userId;

      // 관리자 권한 확인
      if (!req.user?.isAdmin) {
        const error = ValidationError.forbidden('관리자 권한이 필요합니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      const term = await this.termService.updateTerm(id, {
        title: updateData.title,
        content: updateData.content,
        isRequired: updateData.isRequired,
        version: updateData.version,
      });

      // Prisma 객체를 response 스키마에 맞게 변환
      const termDto = termResponseSchema.parse({
        id: term.id,
        type: term.type,
        title: term.title,
        content: term.content,
        isRequired: term.isRequired,
        version: term.version,
        createdAt: term.createdAt.toISOString(),
      });
      logger.info('✅ 약관 수정 성공', {
        termId: id,
        adminId,
        version: term.version,
      });
      return TermSuccess.termUpdated(termDto).send(res);
    } catch (error) {
      logger.error('약관 수정 중 오류 발생:', error);

      // TermError인 경우 원래 에러 그대로 반환
      if (error instanceof TermError) {
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      // 기타 에러는 일반적인 수정 실패 에러로 처리
      const termError = TermError.updateFailed('약관 수정에 실패했습니다.');
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 약관 삭제 (관리자 전용)
   */
  async deleteTerm(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user?.userId;

      // 관리자 권한 확인
      if (!req.user?.isAdmin) {
        const error = ValidationError.forbidden('관리자 권한이 필요합니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      await this.termService.deleteTerm(id);
      logger.info('✅ 약관 삭제 성공', { termId: id, adminId });
      return TermSuccess.termDeleted().send(res);
    } catch (error) {
      logger.error('약관 삭제 중 오류 발생:', error);

      // TermError인 경우 원래 에러 그대로 반환
      if (error instanceof TermError) {
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      // 기타 에러는 일반적인 삭제 실패 에러로 처리
      const termError = TermError.deletionFailed('약관 삭제에 실패했습니다.');
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 사용자 약관 동의
   */
  async agreeToTerm(req: Request, res: Response): Promise<void> {
    try {
      const agreeData = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      const agreement = await this.termService.agreeToTerm(
        userId,
        agreeData.termId
      );
      // Prisma 객체를 response 스키마에 맞게 변환
      const agreementDto = userTermAgreementResponseSchema.parse({
        id: agreement.id,
        userId: agreement.userId,
        termId: agreement.termId,
        agreedAt: agreement.agreedAt.toISOString(),
      });
      logger.info('✅ 사용자 약관 동의 성공', {
        userId,
        termId: agreeData.termId,
        agreedAt: agreement.agreedAt,
      });
      return TermSuccess.termAgreed(agreementDto).send(res);
    } catch (error) {
      logger.error('약관 동의 중 오류 발생:', error);
      const termError = TermError.agreementFailed('약관 동의에 실패했습니다.');
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 사용자 동의한 약관 목록 조회
   */
  async getUserAgreements(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      const agreements = await this.termService.getUserAgreements(userId);
      const agreementDtos = agreements.map(agreement =>
        userTermAgreementResponseSchema.parse({
          id: agreement.id,
          userId: agreement.userId,
          termId: agreement.termId,
          agreedAt: agreement.agreedAt.toISOString(),
        })
      );
      logger.info('✅ 사용자 약관 동의 목록 응답 성공', {
        userId,
        count: agreements.length,
      });
      return TermSuccess.userAgreementsRetrieved(agreementDtos, {
        count: agreements.length,
      }).send(res);
    } catch (error) {
      logger.error('사용자 약관 동의 목록 조회 중 오류 발생:', error);
      const termError = TermError.userAgreementsRetrievalFailed(
        '사용자 약관 동의 목록 조회에 실패했습니다.'
      );
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }
}
