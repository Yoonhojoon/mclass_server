import { Request, Response } from 'express';
import { TermService } from './term.service';
import { TermError } from '../../common/exception/term/TermError';
import { ValidationError } from '../../common/exception/ValidationError.js';
import { TermSuccess } from '../../common/exception/term/TermSuccess.js';
import logger from '../../config/logger.config.js';

// 사용자 타입 정의
interface AuthenticatedUser {
  id: string;
  role?: string;
  isAdmin?: boolean;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export class TermController {
  constructor(private readonly termService: TermService) {}

  /**
   * 모든 약관 목록 조회
   */
  async getAllTerms(req: Request, res: Response): Promise<void> {
    try {
      const terms = await this.termService.getAllTerms();
      logger.info('✅ 모든 약관 목록 응답 성공', { count: terms.length });
      res.json(TermSuccess.termsRetrieved(terms).toResponse());
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
      logger.info('✅ 특정 약관 조회 성공', {
        termId: id,
        type: term.type,
        version: term.version,
      });
      res.json(TermSuccess.termRetrieved(term).toResponse());
    } catch (error) {
      logger.error('약관 조회 중 오류 발생:', error);
      const termError = TermError.notFound(req.params.id);
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 약관 유형별 조회
   */
  async getTermsByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const terms = await this.termService.getTermsByType(
        type as 'SERVICE' | 'PRIVACY' | 'ENROLLMENT'
      );
      logger.info('✅ 약관 유형별 목록 응답 성공', {
        type,
        count: terms.length,
      });
      res.json(TermSuccess.termTypeRetrieved(terms).toResponse());
    } catch (error) {
      logger.error('약관 유형별 조회 중 오류 발생:', error);
      const termError = TermError.typeNotFound(req.params.type);
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 필수 약관 조회
   */
  async getRequiredTerms(req: Request, res: Response): Promise<void> {
    try {
      const terms = await this.termService.getRequiredTerms();
      logger.info('✅ 필수 약관 목록 응답 성공', { count: terms.length });
      res.json(TermSuccess.requiredTermsRetrieved(terms).toResponse());
    } catch (error) {
      logger.error('필수 약관 조회 중 오류 발생:', error);
      const termError = TermError.requiredTermsNotFound();
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 최신 버전의 약관 조회
   */
  async getLatestTermsByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const term = await this.termService.getLatestTermsByType(
        type as 'SERVICE' | 'PRIVACY' | 'ENROLLMENT'
      );
      logger.info('✅ 최신 약관 조회 성공', {
        type,
        termId: term.id,
        version: term.version,
      });
      res.json(TermSuccess.latestTermRetrieved(term).toResponse());
    } catch (error) {
      logger.error('최신 약관 조회 중 오류 발생:', error);
      const termError = TermError.latestVersionNotFound(req.params.type);
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 약관 생성 (관리자 전용)
   */
  async createTerm(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type, title, content, isRequired, version } = req.body;
      const adminId = req.user?.id;

      // 관리자 권한 확인
      if (!req.user?.isAdmin) {
        const error = ValidationError.forbidden('관리자 권한이 필요합니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      const term = await this.termService.createTerm({
        type,
        title,
        content,
        isRequired: isRequired || false,
        version,
      });

      logger.info('✅ 약관 생성 성공', {
        termId: term.id,
        adminId,
        type,
        version,
      });
      res.status(201).json(TermSuccess.termCreated(term).toResponse());
    } catch (error) {
      logger.error('약관 생성 중 오류 발생:', error);
      const termError = TermError.creationFailed('약관 생성에 실패했습니다.');
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 약관 수정 (관리자 전용)
   */
  async updateTerm(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, isRequired, version } = req.body;
      const adminId = req.user?.id;

      // 관리자 권한 확인
      if (!req.user?.isAdmin) {
        const error = ValidationError.forbidden('관리자 권한이 필요합니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      const term = await this.termService.updateTerm(id, {
        title,
        content,
        isRequired,
        version,
      });

      logger.info('✅ 약관 수정 성공', {
        termId: id,
        adminId,
        version: term.version,
      });
      res.json(TermSuccess.termUpdated(term).toResponse());
    } catch (error) {
      logger.error('약관 수정 중 오류 발생:', error);
      const termError = TermError.updateFailed('약관 수정에 실패했습니다.');
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 약관 삭제 (관리자 전용)
   */
  async deleteTerm(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      // 관리자 권한 확인
      if (!req.user?.isAdmin) {
        const error = ValidationError.forbidden('관리자 권한이 필요합니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      await this.termService.deleteTerm(id);
      logger.info('✅ 약관 삭제 성공', { termId: id, adminId });
      res.json(TermSuccess.termDeleted().toResponse());
    } catch (error) {
      logger.error('약관 삭제 중 오류 발생:', error);
      const termError = TermError.deletionFailed('약관 삭제에 실패했습니다.');
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 사용자 약관 동의
   */
  async agreeToTerm(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { termId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      const agreement = await this.termService.agreeToTerm(userId, termId);
      logger.info('✅ 사용자 약관 동의 성공', {
        userId,
        termId,
        agreedAt: agreement.agreed_at,
      });
      res.status(201).json(TermSuccess.termAgreed(agreement).toResponse());
    } catch (error) {
      logger.error('약관 동의 중 오류 발생:', error);
      const termError = TermError.agreementFailed('약관 동의에 실패했습니다.');
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }

  /**
   * 사용자 동의한 약관 목록 조회
   */
  async getUserAgreements(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      const agreements = await this.termService.getUserAgreements(userId);
      logger.info('✅ 사용자 약관 동의 목록 응답 성공', {
        userId,
        count: agreements.length,
      });
      res.json(TermSuccess.userAgreementsRetrieved(agreements).toResponse());
    } catch (error) {
      logger.error('사용자 약관 동의 목록 조회 중 오류 발생:', error);
      const termError = TermError.userAgreementsRetrievalFailed(
        '사용자 약관 동의 목록 조회에 실패했습니다.'
      );
      res.status(termError.statusCode).json(termError.toResponse());
    }
  }
}
