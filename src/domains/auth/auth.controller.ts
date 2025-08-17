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

      // 요청 정보 추출
      const device = this.extractDeviceInfo(req);
      const ip = this.extractClientIP(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // 로그인 데이터에 요청 정보 추가
      const enhancedLoginData = {
        ...loginData,
        device,
        ip,
        userAgent,
      };

      logger.info('🔐 로그인 컨트롤러 호출', {
        email: loginData.email,
        device,
        ip,
      });

      const result = await this.authService.login(enhancedLoginData);
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

      // 요청 정보 추출
      const device = this.extractDeviceInfo(req);
      const ip = this.extractClientIP(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // 회원가입 데이터에 요청 정보 추가
      const enhancedRegisterData = {
        ...registerData,
        device,
        ip,
        userAgent,
      };

      logger.info('📝 회원가입 컨트롤러 호출', {
        email: registerData.email,
        name: registerData.name,
        device,
        ip,
      });

      const result = await this.authService.register(enhancedRegisterData);
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

      // 요청 정보 추출
      const device = this.extractDeviceInfo(req);
      const ip = this.extractClientIP(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // 소셜 로그인 데이터에 요청 정보 추가
      const enhancedProfile = {
        ...profile,
        device,
        ip,
        userAgent,
      };

      logger.info('🔗 소셜 로그인 컨트롤러 호출', {
        provider: profile.provider,
        email: profile.email,
        device,
        ip,
      });

      const result = await this.authService.handleSocialLogin(enhancedProfile);

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

  /**
   * 사용자 세션 조회
   */
  async getUserSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('📱 사용자 세션 조회 컨트롤러 호출', { userId });

      const sessions = await this.authService.getUserSessions(userId);

      res.status(200).json({
        success: true,
        message: '사용자 세션 조회 성공',
        data: {
          sessions,
          totalCount: sessions.length,
        },
      });
    } catch (error) {
      logger.error('❌ 사용자 세션 조회 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const authError = AuthError.internalError(
          '사용자 세션 조회 중 오류가 발생했습니다.'
        );
        res.status(authError.statusCode).json(authError.toResponse());
      }
    }
  }

  /**
   * 특정 기기 로그아웃
   */
  async logoutDevice(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { token } = req.body;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      if (!token) {
        const error = ValidationError.badRequest('토큰이 필요합니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('🚪 특정 기기 로그아웃 컨트롤러 호출', { userId });

      const success = await this.authService.logoutDevice(userId, token);

      if (success) {
        res.status(200).json({
          success: true,
          message: '특정 기기 로그아웃 성공',
        });
      } else {
        res.status(400).json({
          success: false,
          message: '토큰을 찾을 수 없습니다.',
        });
      }
    } catch (error) {
      logger.error('❌ 특정 기기 로그아웃 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const authError = AuthError.internalError(
          '특정 기기 로그아웃 중 오류가 발생했습니다.'
        );
        res.status(authError.statusCode).json(authError.toResponse());
      }
    }
  }

  /**
   * 모든 기기 로그아웃
   */
  async logoutAllDevices(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('🚪 모든 기기 로그아웃 컨트롤러 호출', { userId });

      const removedCount = await this.authService.logoutAllDevices(userId);

      res.status(200).json({
        success: true,
        message: '모든 기기 로그아웃 성공',
        data: {
          removedCount,
        },
      });
    } catch (error) {
      logger.error('❌ 모든 기기 로그아웃 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const authError = AuthError.internalError(
          '모든 기기 로그아웃 중 오류가 발생했습니다.'
        );
        res.status(authError.statusCode).json(authError.toResponse());
      }
    }
  }

  /**
   * 활성 세션 수 조회
   */
  async getActiveSessionCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('📊 활성 세션 수 조회 컨트롤러 호출', { userId });

      const count = await this.authService.getActiveSessionCount(userId);

      res.status(200).json({
        success: true,
        message: '활성 세션 수 조회 성공',
        data: {
          activeSessionCount: count,
        },
      });
    } catch (error) {
      logger.error('❌ 활성 세션 수 조회 컨트롤러 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof AuthError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const authError = AuthError.internalError(
          '활성 세션 수 조회 중 오류가 발생했습니다.'
        );
        res.status(authError.statusCode).json(authError.toResponse());
      }
    }
  }

  /**
   * 클라이언트 IP 주소 추출
   */
  private extractClientIP(req: Request): string {
    // X-Forwarded-For 헤더 확인 (프록시 환경)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }

    // X-Real-IP 헤더 확인
    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    // 기본 IP 주소
    return req.ip || req.connection.remoteAddress || 'Unknown';
  }

  /**
   * 디바이스 정보 추출
   */
  private extractDeviceInfo(req: Request): string {
    const userAgent = req.headers['user-agent'] || '';

    // 모바일 디바이스 확인
    if (
      /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      )
    ) {
      return 'Mobile';
    }

    // 데스크톱 브라우저 확인
    if (/Chrome|Firefox|Safari|Edge|MSIE|Trident/i.test(userAgent)) {
      return 'Desktop';
    }

    // API 클라이언트 확인
    if (/Postman|curl|axios|fetch/i.test(userAgent)) {
      return 'API Client';
    }

    return 'Unknown';
  }
}
