import { UserService } from '../user/user.service.js';
import { TokenService, TokenPayload } from '../token/token.service.js';
import { AuthError } from '../../common/exception/auth/AuthError.js';
import { UserError } from '../../common/exception/user/UserError.js';
import logger from '../../config/logger.config.js';
import { PrismaClient, User } from '@prisma/client';
import { AuthRepository } from './auth.repository.js';
import { LoginDto, RegisterDto, SocialLoginDto } from './auth.schemas.js';
import { TokenStorageService } from '../../services/redis/token-storage.service.js';

export class AuthService {
  private userService: UserService;
  private authRepository: AuthRepository;

  constructor(prisma: PrismaClient) {
    this.userService = new UserService(prisma);
    this.authRepository = new AuthRepository(prisma);
  }

  /**
   * 사용자 로그인
   */
  async login(loginData: LoginDto): Promise<{
    user: {
      userId: string;
      email: string;
      name: string | null;
      role: string;
      isAdmin: boolean;
      isSignUpCompleted: boolean;
      provider: string;
    };
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      logger.info('🔐 로그인 시도', { email: loginData.email });

      const user = await this.authenticateUser(
        loginData.email,
        loginData.password
      );

      if (!user) {
        logger.warn('❌ 로그인 실패: 잘못된 인증 정보', {
          email: loginData.email,
        });
        throw AuthError.invalidCredentials();
      }

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        signUpCompleted: user.isSignUpCompleted || false,
      };

      const accessToken = await TokenService.generateAndStoreAccessToken(
        tokenPayload,
        {
          device: loginData.device,
          ip: loginData.ip,
          userAgent: loginData.userAgent,
        }
      );
      const refreshToken = await TokenService.generateAndStoreRefreshToken(
        tokenPayload,
        {
          device: loginData.device,
          ip: loginData.ip,
          userAgent: loginData.userAgent,
        }
      );

      logger.info('✅ 로그인 성공', {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        signUpCompleted: user.isSignUpCompleted || false,
      });

      return {
        user: {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isAdmin: user.isAdmin,
          isSignUpCompleted: user.isSignUpCompleted || false,
          provider: user.provider,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      // UserError를 적절한 AuthError로 변환
      if (error instanceof UserError) {
        if (error.errorCode === 'USER_PASSWORD_MISMATCH') {
          throw AuthError.authenticationFailed('비밀번호가 일치하지 않습니다.');
        } else if (error.errorCode === 'USER_NOT_FOUND') {
          throw AuthError.invalidCredentials();
        } else if (error.errorCode === 'USER_INVALID_PROVIDER') {
          throw AuthError.socialProviderNotSupported('LOCAL');
        } else {
          throw AuthError.authenticationFailed(error.message);
        }
      }

      logger.error('❌ 로그인 처리 중 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw AuthError.loginFailed('로그인 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 회원가입
   */
  async register(registerData: RegisterDto): Promise<{
    user: {
      userId: string;
      email: string;
      name: string | null;
      role: string;
      isAdmin: boolean;
      isSignUpCompleted: boolean;
      provider: string;
    };
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      logger.info('📝 회원가입 시도', {
        email: registerData.email,
        name: registerData.name,
      });

      // 사용자 검증
      await this.validateUser(registerData);

      // 사용자 생성
      const user = await this.createUser(registerData);

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        signUpCompleted: user.isSignUpCompleted || false,
      };

      const accessToken = await TokenService.generateAndStoreAccessToken(
        tokenPayload,
        {
          device: registerData.device,
          ip: registerData.ip,
          userAgent: registerData.userAgent,
        }
      );
      const refreshToken = await TokenService.generateAndStoreRefreshToken(
        tokenPayload,
        {
          device: registerData.device,
          ip: registerData.ip,
          userAgent: registerData.userAgent,
        }
      );

      logger.info('✅ 회원가입 성공', {
        userId: user.id,
        email: user.email,
        role: user.role,
        signUpCompleted: user.isSignUpCompleted || false,
      });

      return {
        user: {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isAdmin: user.isAdmin,
          isSignUpCompleted: user.isSignUpCompleted || false,
          provider: user.provider,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      if (error instanceof UserError) {
        // UserError를 그대로 전파 (이미 등록된 이메일 등의 구체적인 오류)
        throw error;
      }
      logger.error('❌ 회원가입 처리 중 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw AuthError.registrationFailed(
        '회원가입 처리 중 오류가 발생했습니다.'
      );
    }
  }

  /**
   * 로그아웃
   */
  async logout(token: string): Promise<void> {
    try {
      logger.info('🚪 로그아웃 처리');
      // 토큰을 블랙리스트에 추가
      await TokenService.invalidateToken(token);
      logger.info('✅ 로그아웃 완료');
    } catch (error) {
      logger.error('❌ 로그아웃 처리 중 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      logger.info('🔑 비밀번호 변경 시도', { userId });

      const user = await this.userService.findById(userId);

      if (!user) {
        logger.warn('❌ 비밀번호 변경 실패: 사용자를 찾을 수 없음', { userId });
        throw AuthError.authenticationFailed('사용자를 찾을 수 없습니다.');
      }

      // 현재 비밀번호 확인
      const isCurrentPasswordValid = await this.authenticateUser(
        user.email,
        currentPassword
      );

      if (!isCurrentPasswordValid) {
        logger.warn('❌ 비밀번호 변경 실패: 현재 비밀번호 불일치', { userId });
        throw AuthError.invalidCredentials();
      }

      // 새 비밀번호로 변경
      await this.updatePassword(userId, newPassword);

      logger.info('✅ 비밀번호 변경 성공', { userId });
      return true;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('❌ 비밀번호 변경 중 오류', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw AuthError.passwordChangeFailed(
        '비밀번호 변경 중 오류가 발생했습니다.'
      );
    }
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      logger.info('🔄 토큰 갱신 시도');

      const decoded = TokenService.verifyRefreshToken(refreshToken);

      const user = await this.userService.findById(decoded.userId);

      if (!user) {
        logger.warn('❌ 토큰 갱신 실패: 사용자를 찾을 수 없음', {
          userId: decoded.userId,
        });
        throw AuthError.authenticationFailed('사용자를 찾을 수 없습니다.');
      }

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        signUpCompleted: user.isSignUpCompleted || false,
      };

      // 기존 리프레시 토큰의 메타데이터를 가져와서 재사용
      const tokenMetadata =
        await TokenStorageService.getTokenMetadata(refreshToken);

      const newAccessToken = await TokenService.generateAndStoreAccessToken(
        tokenPayload,
        {
          device: tokenMetadata?.device,
          ip: tokenMetadata?.ip,
          userAgent: tokenMetadata?.userAgent,
        }
      );
      const newRefreshToken = await TokenService.generateAndStoreRefreshToken(
        tokenPayload,
        {
          device: tokenMetadata?.device,
          ip: tokenMetadata?.ip,
          userAgent: tokenMetadata?.userAgent,
        }
      );

      logger.info('✅ 토큰 갱신 성공', { userId: user.id });
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('❌ 토큰 갱신 중 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw AuthError.tokenRefreshFailed('토큰 갱신 중 오류가 발생했습니다.');
    }
  }

  /**
   * 소셜 로그인 처리
   */
  async handleSocialLogin(profile: SocialLoginDto): Promise<{
    user: {
      userId: string;
      email: string;
      name: string | null;
      role: string;
      isAdmin: boolean;
      isSignUpCompleted: boolean;
      provider: string;
    };
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      logger.info('🔗 소셜 로그인 처리', {
        provider: profile.provider,
        email: profile.email,
      });

      // 1. 기존 사용자 확인
      const socialId =
        profile.provider === 'kakao' ? profile.kakaoId : profile.sub;
      let user = await this.findBySocialId(
        socialId,
        profile.provider.toUpperCase()
      );

      if (!user) {
        logger.info('👤 새 소셜 사용자 생성', {
          provider: profile.provider,
          email: profile.email,
        });

        // 2. 새 사용자 생성 (준회원 상태)
        user = await this.createSocialUser({
          email: profile.email,
          name: profile.name,
          provider: profile.provider.toUpperCase() as
            | 'KAKAO'
            | 'GOOGLE'
            | 'NAVER',
          socialId,
          isSignUpCompleted: false,
        });
      } else {
        logger.info('👤 기존 소셜 사용자 로그인', {
          userId: user.id,
          provider: profile.provider,
        });
      }

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        signUpCompleted: user.isSignUpCompleted || false,
        provider: user.provider,
      };

      const accessToken = await TokenService.generateAndStoreAccessToken(
        tokenPayload,
        {
          device: profile.device,
          ip: profile.ip,
          userAgent: profile.userAgent,
        }
      );
      const refreshToken = await TokenService.generateAndStoreRefreshToken(
        tokenPayload,
        {
          device: profile.device,
          ip: profile.ip,
          userAgent: profile.userAgent,
        }
      );

      logger.info('✅ 소셜 로그인 성공', {
        userId: user.id,
        provider: profile.provider,
        signUpCompleted: user.isSignUpCompleted || false,
      });

      return {
        user: {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isAdmin: user.isAdmin,
          isSignUpCompleted: user.isSignUpCompleted || false,
          provider: user.provider,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('❌ 소셜 로그인 처리 중 오류', {
        provider: profile.provider,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw AuthError.loginFailed('소셜 로그인 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 약관 동의 완료 처리
   */
  async completeSignUp(
    userId: string,
    termIds: string[]
  ): Promise<{
    user: {
      userId: string;
      email: string;
      name: string | null;
      role: string;
      isAdmin: boolean;
      isSignUpCompleted: boolean;
      provider: string;
    };
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      logger.info('📋 약관 동의 완료 처리', { userId, termIds });

      // 1. 약관 동의 처리
      // Validate termIds first
      const validTerms = await this.validateTermIds(termIds);
      if (validTerms.length !== termIds.length) {
        throw AuthError.invalidRequest(
          '유효하지 않은 약관 ID가 포함되어 있습니다.'
        );
      }

      // Process agreements in parallel
      await Promise.all(
        termIds.map(async termId => {
          await this.agreeToTerm(userId, termId);
          logger.debug('✅ 약관 동의 완료', { userId, termId });
        })
      );

      // 2. 사용자 상태 업데이트
      const user = await this.updateSignUpStatus(userId, true);

      // 3. 새로운 토큰 발급 (회원가입 완료)
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        signUpCompleted: true,
        provider: user.provider,
      };

      // 기존 토큰의 메타데이터를 가져와서 재사용 (회원가입 완료는 기존 세션에서 진행)
      const userTokens = await TokenStorageService.getUserTokens(userId);
      const latestToken = userTokens[0]; // 가장 최근 토큰 사용

      const accessToken = await TokenService.generateAndStoreAccessToken(
        tokenPayload,
        {
          device: latestToken?.device,
          ip: latestToken?.ip,
          userAgent: latestToken?.userAgent,
        }
      );
      const refreshToken = await TokenService.generateAndStoreRefreshToken(
        tokenPayload,
        {
          device: latestToken?.device,
          ip: latestToken?.ip,
          userAgent: latestToken?.userAgent,
        }
      );

      logger.info('✅ 회원가입 완료', {
        userId: user.id,
        email: user.email,
        termCount: termIds.length,
      });

      return {
        user: {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isAdmin: user.isAdmin,
          isSignUpCompleted: true,
          provider: user.provider,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('❌ 회원가입 완료 처리 중 오류', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw AuthError.registrationFailed(
        '회원가입 완료 처리 중 오류가 발생했습니다.'
      );
    }
  }

  /**
   * 사용자 인증 (LOCAL 로그인)
   */
  private async authenticateUser(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw UserError.notFound();
    }

    if (user.provider !== 'LOCAL') {
      throw UserError.invalidProvider();
    }

    if (!user.password) {
      throw UserError.invalidPassword();
    }

    const isPasswordValid = await this.authRepository.verifyPassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw UserError.passwordMismatch();
    }

    return user;
  }

  /**
   * 사용자 생성
   */
  private async createUser(userData: {
    email: string;
    password: string;
    name?: string;
    role?: 'USER' | 'ADMIN';
  }): Promise<User> {
    return await this.authRepository.createUser({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role,
      provider: 'LOCAL',
      isSignUpCompleted: false,
    });
  }

  /**
   * 사용자 데이터 검증
   */
  private async validateUser(userData: {
    email: string;
    password: string;
    name?: string;
    role?: 'USER' | 'ADMIN';
  }): Promise<void> {
    if (!userData.email) {
      throw UserError.invalidEmail();
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw UserError.invalidEmail();
    }

    // 비밀번호 길이 검증
    if (userData.password.length < 6) {
      throw UserError.invalidPassword();
    }
  }

  /**
   * 비밀번호 변경 (내부용)
   */
  private async updatePassword(
    id: string,
    newPassword: string
  ): Promise<boolean> {
    const existingUser = await this.userService.findById(id);

    if (!existingUser) {
      throw UserError.notFound();
    }

    if (existingUser.provider !== 'LOCAL') {
      throw UserError.invalidProvider();
    }

    const hashedPassword = await this.authRepository.hashPassword(newPassword);
    await this.authRepository.updatePassword(id, hashedPassword);

    return true;
  }

  /**
   * 소셜 ID로 사용자 찾기
   */
  private async findBySocialId(
    socialId: string,
    provider: string
  ): Promise<User | null> {
    return await this.authRepository.findBySocialId(socialId, provider);
  }

  /**
   * 소셜 로그인 사용자 생성
   */
  private async createSocialUser(socialData: {
    email: string;
    name?: string;
    provider: 'KAKAO' | 'GOOGLE' | 'NAVER';
    socialId: string;
    isSignUpCompleted?: boolean;
  }): Promise<User> {
    return await this.authRepository.createSocialUser(socialData);
  }

  /**
   * 회원가입 완료 상태 업데이트
   */
  private async updateSignUpStatus(
    userId: string,
    isSignUpCompleted: boolean
  ): Promise<User> {
    const existingUser = await this.userService.findById(userId);

    if (!existingUser) {
      throw UserError.notFound();
    }

    return await this.authRepository.updateSignUpStatus(
      userId,
      isSignUpCompleted
    );
  }

  /**
   * 약관 ID 목록 검증
   */
  private async validateTermIds(termIds: string[]): Promise<string[]> {
    return await this.authRepository.validateTermIds(termIds);
  }

  /**
   * 약관 동의 처리
   */
  private async agreeToTerm(userId: string, termId: string): Promise<void> {
    // 약관 동의는 TermService에서 처리하므로 여기서는 UserService와 연결
    const { TermService } = await import('../term/term.service.js');
    const termService = new TermService(this.authRepository.getPrisma());
    await termService.agreeToTerm(userId, termId);
  }

  /**
   * 사용자의 모든 활성 세션 조회
   */
  async getUserSessions(userId: string): Promise<any[]> {
    try {
      const tokens = await TokenStorageService.getUserTokens(userId);
      return tokens.map(token => ({
        device: token.device || '알 수 없음',
        ip: token.ip || '알 수 없음',
        userAgent: token.userAgent || '알 수 없음',
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        tokenType: token.tokenType,
      }));
    } catch (error) {
      logger.error('❌ 사용자 세션 조회 실패', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw AuthError.authenticationFailed('세션 조회에 실패했습니다.');
    }
  }

  /**
   * 특정 기기 로그아웃
   */
  async logoutDevice(userId: string, token: string): Promise<boolean> {
    try {
      const meta = await TokenStorageService.getTokenMetadata(token);
      if (!meta || meta.userId !== userId) {
        logger.warn('⚠️ 타 사용자 토큰 로그아웃 시도 차단', { userId });
        throw AuthError.permissionDenied('세션', '로그아웃');
      }
      const success = await TokenStorageService.removeToken(token);
      if (success) {
        logger.info('✅ 특정 기기 로그아웃 완료', { userId });
      }
      return success;
    } catch (error) {
      logger.error('❌ 특정 기기 로그아웃 실패', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw AuthError.authenticationFailed('기기 로그아웃에 실패했습니다.');
    }
  }

  /**
   * 모든 기기 로그아웃
   */
  async logoutAllDevices(userId: string): Promise<number> {
    try {
      const removedCount =
        await TokenStorageService.removeAllUserTokens(userId);
      logger.info('✅ 모든 기기 로그아웃 완료', { userId, removedCount });
      return removedCount;
    } catch (error) {
      logger.error('❌ 모든 기기 로그아웃 실패', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw AuthError.authenticationFailed(
        '모든 기기 로그아웃에 실패했습니다.'
      );
    }
  }

  /**
   * 사용자 활성 세션 수 조회
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    try {
      return await TokenStorageService.getUserActiveSessionCount(userId);
    } catch (error) {
      logger.error('❌ 활성 세션 수 조회 실패', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }
}
