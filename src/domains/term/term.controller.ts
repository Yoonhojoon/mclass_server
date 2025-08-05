import { Request, Response } from 'express';
import { TermService } from './term.service';
import { TermSuccessResponse } from '../../common/exception/term/TermSuccess';
import { TermError } from '../../common/exception/term/TermError';
import logger from '../../config/logger.config.js';

// 사용자 타입 정의
interface AuthenticatedUser {
  id: string;
  is_admin?: boolean;
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
    const terms = await this.termService.getAllTerms();
    const response = TermSuccessResponse.termsRetrieved(terms);
    res.json(response);
  }

  /**
   * 특정 약관 조회
   */
  async getTermById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const term = await this.termService.getTermById(id);
    const response = TermSuccessResponse.termRetrieved(term);
    res.json(response);
  }

  /**
   * 약관 유형별 조회
   */
  async getTermsByType(req: Request, res: Response): Promise<void> {
    const { type } = req.params;
    const terms = await this.termService.getTermsByType(type as any);
    const response = TermSuccessResponse.termTypeRetrieved(terms);
    res.json(response);
  }

  /**
   * 필수 약관 조회
   */
  async getRequiredTerms(req: Request, res: Response): Promise<void> {
    const terms = await this.termService.getRequiredTerms();
    const response = TermSuccessResponse.requiredTermsRetrieved(terms);
    res.json(response);
  }

  /**
   * 최신 버전의 약관 조회
   */
  async getLatestTermsByType(req: Request, res: Response): Promise<void> {
    const { type } = req.params;
    const term = await this.termService.getLatestTermsByType(type as any);
    const response = TermSuccessResponse.latestTermRetrieved(term);
    res.json(response);
  }

  /**
   * 약관 생성 (관리자 전용)
   */
  async createTerm(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { type, title, content, is_required, version } = req.body;
    const adminId = req.user?.id;

    // 관리자 권한 확인
    if (!req.user?.is_admin) {
      const error = TermError.insufficientPermissions('약관 생성');
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.errorCode,
          message: error.message,
        },
      });
      return;
    }

    const term = await this.termService.createTerm({
      type,
      title,
      content,
      is_required: is_required || false,
      version,
    });

    logger.info('약관이 생성되었습니다.', {
      termId: term.id,
      adminId,
      termType: type,
    });

    const response = TermSuccessResponse.termCreated(term);
    res.status(201).json(response);
  }

  /**
   * 약관 수정 (관리자 전용)
   */
  async updateTerm(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { title, content, is_required, version } = req.body;
    const adminId = req.user?.id;

    // 관리자 권한 확인
    if (!req.user?.is_admin) {
      const error = TermError.insufficientPermissions('약관 수정');
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.errorCode,
          message: error.message,
        },
      });
      return;
    }

    const term = await this.termService.updateTerm(id, {
      title,
      content,
      is_required,
      version,
    });

    logger.info('약관이 수정되었습니다.', {
      termId: id,
      adminId,
    });

    const response = TermSuccessResponse.termUpdated(term);
    res.json(response);
  }

  /**
   * 약관 삭제 (관리자 전용)
   */
  async deleteTerm(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const adminId = req.user?.id;

    // 관리자 권한 확인
    if (!req.user?.is_admin) {
      const error = TermError.insufficientPermissions('약관 삭제');
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.errorCode,
          message: error.message,
        },
      });
      return;
    }

    await this.termService.deleteTerm(id);

    logger.info('약관이 삭제되었습니다.', {
      termId: id,
      adminId,
    });

    const response = TermSuccessResponse.termDeleted();
    res.json(response);
  }

  /**
   * 사용자 약관 동의
   */
  async agreeToTerm(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { termId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      const error = TermError.insufficientPermissions('약관 동의');
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.errorCode,
          message: error.message,
        },
      });
      return;
    }

    const agreement = await this.termService.agreeToTerm(userId, termId);

    logger.info('사용자가 약관에 동의했습니다.', {
      userId,
      termId,
    });

    const response = TermSuccessResponse.termAgreed(agreement);
    res.status(201).json(response);
  }

  /**
   * 사용자 동의한 약관 목록 조회
   */
  async getUserAgreements(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const userId = req.user?.id;

    if (!userId) {
      const error = TermError.insufficientPermissions('사용자 약관 동의 조회');
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.errorCode,
          message: error.message,
        },
      });
      return;
    }

    const agreements = await this.termService.getUserAgreements(userId);
    const response = TermSuccessResponse.userAgreementsRetrieved(agreements);
    res.json(response);
  }
}
