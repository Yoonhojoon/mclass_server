import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthError } from '../../common/exception/auth/AuthError.js';
import logger from '../../config/logger.config.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class AuthController {
  private authService: AuthService;

  constructor(authService?: AuthService) {
    this.authService = authService || new AuthService();
  }

  /**
   * 사용자 로그인
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      logger.info('🔐 로그인 컨트롤러 호출', { email });

      const result = await this.authService.login({ email, password });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('❌ 로그인 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(400).json({
          success: false,
          error: error.name,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: '로그인 처리 중 오류가 발생했습니다.',
        });
      }
    }
  }

  /**
   * 사용자 회원가입
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role } = req.body;
      logger.info('📝 회원가입 컨트롤러 호출', { email, name });

      const result = await this.authService.register({
        email,
        password,
        name,
        role,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('❌ 회원가입 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(400).json({
          success: false,
          error: error.name,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: '회원가입 처리 중 오류가 발생했습니다.',
        });
      }
    }
  }

  /**
   * 소셜 로그인
   */
  async socialLogin(req: Request, res: Response): Promise<void> {
    try {
      const { profile } = req.body;
      logger.info('🔗 소셜 로그인 컨트롤러 호출', {
        provider: profile.provider,
        email: profile.email,
      });

      const result = await this.authService.handleSocialLogin(profile);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('❌ 소셜 로그인 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(400).json({
          success: false,
          error: error.name,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: '소셜 로그인 처리 중 오류가 발생했습니다.',
        });
      }
    }
  }

  /**
   * 약관 동의 완료 (회원가입 완료)
   */
  async completeSignUp(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { termIds } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: '인증이 필요합니다.',
        });
        return;
      }

      if (!termIds || !Array.isArray(termIds)) {
        res.status(400).json({
          success: false,
          error: 'INVALID_TERM_IDS',
          message: '약관 ID 목록이 필요합니다.',
        });
        return;
      }

      logger.info('📋 약관 동의 완료 컨트롤러 호출', { userId, termIds });

      const result = await this.authService.completeSignUp(userId, termIds);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('❌ 약관 동의 완료 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(400).json({
          success: false,
          error: error.name,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: '회원가입 완료 처리 중 오류가 발생했습니다.',
        });
      }
    }
  }

  /**
   * 로그아웃
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      logger.info('🚪 로그아웃 컨트롤러 호출');

      if (token) {
        await this.authService.logout(token);
      }

      res.json({
        success: true,
        message: '로그아웃되었습니다.',
      });
    } catch (error) {
      logger.error('❌ 로그아웃 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '로그아웃 처리 중 오류가 발생했습니다.',
      });
    }
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      logger.info('🔄 토큰 갱신 컨트롤러 호출');

      const result = await this.authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('❌ 토큰 갱신 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(400).json({
          success: false,
          error: error.name,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: '토큰 갱신 중 오류가 발생했습니다.',
        });
      }
    }
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: '인증이 필요합니다.',
        });
        return;
      }
      logger.info('🔑 비밀번호 변경 컨트롤러 호출', { userId });

      await this.authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.json({
        success: true,
        message: '비밀번호가 변경되었습니다.',
      });
    } catch (error) {
      logger.error('❌ 비밀번호 변경 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(400).json({
          success: false,
          error: error.name,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: '비밀번호 변경 중 오류가 발생했습니다.',
        });
      }
    }
  }
}
