import { Request, Response } from 'express';
import { TermService } from './term.service';
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
    try {
      const terms = await this.termService.getAllTerms();

      res.status(200).json({
        success: true,
        data: terms,
      });
    } catch (error) {
      logger.error('약관 목록 조회 실패:', error);

      if (error instanceof TermError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.errorCode,
            message: error.message,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 오류가 발생했습니다.',
          },
        });
      }
    }
  }

  /**
   * 특정 약관 조회
   */
  async getTermById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const term = await this.termService.getTermById(id);

      if (!term) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TERM_NOT_FOUND',
            message: '약관을 찾을 수 없습니다.',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: term,
      });
    } catch (error) {
      logger.error('약관 조회 실패:', error);

      if (error instanceof TermError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.errorCode,
            message: error.message,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 오류가 발생했습니다.',
          },
        });
      }
    }
  }

  /**
   * 약관 생성 (관리자 전용)
   */
  async createTerm(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type, title, content, is_required, version } = req.body;
      const adminId = req.user?.id;

      // 관리자 권한 확인
      if (!req.user?.is_admin) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '관리자 권한이 필요합니다.',
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

      res.status(201).json({
        success: true,
        data: term,
      });
    } catch (error) {
      logger.error('약관 생성 실패:', error);

      if (error instanceof TermError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.errorCode,
            message: error.message,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 오류가 발생했습니다.',
          },
        });
      }
    }
  }

  /**
   * 약관 수정 (관리자 전용)
   */
  async updateTerm(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, is_required, version } = req.body;
      const adminId = req.user?.id;

      // 관리자 권한 확인
      if (!req.user?.is_admin) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '관리자 권한이 필요합니다.',
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

      res.status(200).json({
        success: true,
        data: term,
      });
    } catch (error) {
      logger.error('약관 수정 실패:', error);

      if (error instanceof TermError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.errorCode,
            message: error.message,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 오류가 발생했습니다.',
          },
        });
      }
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
      if (!req.user?.is_admin) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '관리자 권한이 필요합니다.',
          },
        });
        return;
      }

      await this.termService.deleteTerm(id);

      logger.info('약관이 삭제되었습니다.', {
        termId: id,
        adminId,
      });

      res.status(200).json({
        success: true,
        message: '약관이 삭제되었습니다.',
      });
    } catch (error) {
      logger.error('약관 삭제 실패:', error);

      if (error instanceof TermError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.errorCode,
            message: error.message,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 오류가 발생했습니다.',
          },
        });
      }
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
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          },
        });
        return;
      }

      const agreement = await this.termService.agreeToTerm(userId, termId);

      logger.info('사용자가 약관에 동의했습니다.', {
        userId,
        termId,
      });

      res.status(201).json({
        success: true,
        data: agreement,
      });
    } catch (error) {
      logger.error('약관 동의 실패:', error);

      if (error instanceof TermError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.errorCode,
            message: error.message,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 오류가 발생했습니다.',
          },
        });
      }
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
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          },
        });
        return;
      }

      const agreements = await this.termService.getUserAgreements(userId);

      res.status(200).json({
        success: true,
        data: agreements,
      });
    } catch (error) {
      logger.error('사용자 약관 동의 목록 조회 실패:', error);

      if (error instanceof TermError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.errorCode,
            message: error.message,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 오류가 발생했습니다.',
          },
        });
      }
    }
  }
}
