import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthError } from '../../common/exception/auth/AuthError.js';
import { ValidationError } from '../../common/exception/ValidationError.js';
import { AuthSuccessResponse } from '../../common/exception/auth/AuthSuccess.js';
import logger from '../../config/logger.config.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { PrismaClient } from '@prisma/client';
import { LoginDto, RegisterDto, OAuthProfile } from './dto/index.js';

export class AuthController {
  private authService: AuthService;

  constructor(prisma: PrismaClient) {
    this.authService = new AuthService(prisma);
  }

  /**
   * 사용자 로그인
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginDto = req.body;
      logger.info('🔐 로그인 컨트롤러 호출', { email: loginData.email });

      const result = await this.authService.login(loginData);

      res.json(
        AuthSuccessResponse.loginSuccess(
          result.user.id,
          result.user.role,
          result
        )
      );
    } catch (error) {
      logger.error('❌ 로그인 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const authError = AuthError.internalError(
          '로그인 처리 중 오류가 발생했습니다.'
        );
        res.status(authError.statusCode).json(authError.toResponse());
      }
    }
  }

  /**
   * 사용자 회원가입
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const registerData: RegisterDto = req.body;
      logger.info('📝 회원가입 컨트롤러 호출', {
        email: registerData.email,
        name: registerData.name,
      });

      const result = await this.authService.register(registerData);

      res.json(
        AuthSuccessResponse.loginSuccess(
          result.user.id,
          result.user.role,
          result
        )
      );
    } catch (error) {
      logger.error('❌ 회원가입 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const authError = AuthError.internalError(
          '회원가입 처리 중 오류가 발생했습니다.'
        );
        res.status(authError.statusCode).json(authError.toResponse());
      }
    }
  }

  /**
   * 소셜 로그인
   */
  async socialLogin(req: Request, res: Response): Promise<void> {
    try {
      const { profile }: { profile: OAuthProfile } = req.body;
      logger.info('🔗 소셜 로그인 컨트롤러 호출', {
        provider: profile.provider,
        email: profile.email,
      });

      const result = await this.authService.handleSocialLogin(profile);

      res.json(
        AuthSuccessResponse.loginSuccess(
          result.user.id,
          result.user.role,
          result
        )
      );
    } catch (error) {
      logger.error('❌ 소셜 로그인 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const authError = AuthError.internalError(
          '소셜 로그인 처리 중 오류가 발생했습니다.'
        );
        res.status(authError.statusCode).json(authError.toResponse());
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
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      if (!termIds || !Array.isArray(termIds)) {
        const error = ValidationError.invalidTermIds();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('📋 약관 동의 완료 컨트롤러 호출', { userId, termIds });

      const result = await this.authService.completeSignUp(userId, termIds);

      res.json(
        AuthSuccessResponse.loginSuccess(
          result.user.id,
          result.user.role,
          result
        )
      );
    } catch (error) {
      logger.error('❌ 약관 동의 완료 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const authError = AuthError.internalError(
          '회원가입 완료 처리 중 오류가 발생했습니다.'
        );
        res.status(authError.statusCode).json(authError.toResponse());
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

      res.json(AuthSuccessResponse.logoutSuccess());
    } catch (error) {
      logger.error('❌ 로그아웃 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const authError = AuthError.internalError(
        '로그아웃 처리 중 오류가 발생했습니다.'
      );
      res.status(authError.statusCode).json(authError.toResponse());
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

      res.json(AuthSuccessResponse.tokenRefreshSuccess(3600, result));
    } catch (error) {
      logger.error('❌ 토큰 갱신 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const authError = AuthError.internalError(
          '토큰 갱신 처리 중 오류가 발생했습니다.'
        );
        res.status(authError.statusCode).json(authError.toResponse());
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
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }
      logger.info('🔑 비밀번호 변경 컨트롤러 호출', { userId });

      await this.authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.json(AuthSuccessResponse.passwordChangeSuccess());
    } catch (error) {
      logger.error('❌ 비밀번호 변경 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const authError = AuthError.internalError(
          '비밀번호 변경 처리 중 오류가 발생했습니다.'
        );
        res.status(authError.statusCode).json(authError.toResponse());
      }
    }
  }
}
