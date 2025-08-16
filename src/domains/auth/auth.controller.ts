import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthError } from '../../common/exception/auth/AuthError.js';
import { ValidationError } from '../../common/exception/ValidationError.js';
import { AuthSuccess } from '../../common/exception/auth/AuthSuccess.js';
import logger from '../../config/logger.config.js';
import { PrismaClient } from '@prisma/client';
import { LoginRequest, RegisterRequest } from '../../schemas/auth/index.js';
import {
  SocialLoginDto,
  CompleteSignUpDto,
  RefreshTokenDto,
  ChangePasswordDto,
} from './auth.schemas.js';
import { userResponseSchema } from '../../schemas/auth/response.schema.js';

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
      const loginData: LoginRequest = req.body;
      logger.info('🔐 로그인 컨트롤러 호출', { email: loginData.email });

      const result = await this.authService.login(loginData);
      const userResponse = userResponseSchema.parse(result.user);

      return AuthSuccess.loginSuccess(result.user.userId, result.user.role, {
        ...result,
        user: userResponse,
      }).send(res);
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
      const registerData: RegisterRequest = req.body;
      logger.info('📝 회원가입 컨트롤러 호출', {
        email: registerData.email,
        name: registerData.name,
      });

      const result = await this.authService.register(registerData);
      const userResponse = userResponseSchema.parse(result.user);

      return AuthSuccess.registerSuccess(result.user.userId, result.user.role, {
        ...result,
        user: userResponse,
      }).send(res);
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
      const profile: SocialLoginDto = req.body;
      logger.info('🔗 소셜 로그인 컨트롤러 호출', {
        provider: profile.provider,
        email: profile.email,
      });

      const result = await this.authService.handleSocialLogin(profile);

      return AuthSuccess.loginSuccess(
        result.user.userId,
        result.user.role,
        result
      ).send(res);
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
   * 회원가입 완료
   */
  async completeSignUp(
    req: Request & { body: CompleteSignUpDto },
    res: Response
  ): Promise<void> {
    try {
      const { termIds }: CompleteSignUpDto = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('✅ 회원가입 완료 컨트롤러 호출', {
        userId,
        termIds,
      });

      const result = await this.authService.completeSignUp(userId, termIds);

      return AuthSuccess.loginSuccess(
        result.user.userId,
        result.user.role,
        result
      ).send(res);
    } catch (error) {
      logger.error('❌ 회원가입 완료 컨트롤러 오류', {
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

      return AuthSuccess.logoutSuccess().send(res);
    } catch (error) {
      logger.error('❌ 로그아웃 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const authError = AuthError.internalError(
          '로그아웃 처리 중 오류가 발생했습니다.'
        );
        res.status(authError.statusCode).json(authError.toResponse());
      }
    }
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenDto = req.body;
      logger.info('🔄 토큰 갱신 컨트롤러 호출');

      const result = await this.authService.refreshToken(refreshToken);

      return AuthSuccess.tokenRefreshSuccess(3600, result).send(res);
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
    req: Request & { body: ChangePasswordDto },
    res: Response
  ): Promise<void> {
    try {
      const { currentPassword, newPassword }: ChangePasswordDto = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('🔒 비밀번호 변경 컨트롤러 호출', { userId });

      await this.authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      return AuthSuccess.passwordChangeSuccess().send(res);
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
