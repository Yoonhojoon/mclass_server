import {
  AuthService,
  LoginDto,
  RegisterDto,
} from '../../domains/auth/auth.service';
import { UserService } from '../../domains/user/user.service';
import { TokenService } from '../../domains/token/token.service';
import { AuthError } from '../../common/exception/auth/AuthError';

// Mock dependencies
jest.mock('../../domains/user/user.service');
jest.mock('../../domains/token/token.service');
jest.mock('../../config/logger.config', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<UserService>;
  let mockTokenService: jest.Mocked<typeof TokenService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock UserService
    mockUserService = {
      authenticateUser: jest.fn(),
      validateUser: jest.fn(),
      createUser: jest.fn(),
      findById: jest.fn(),
      findBySocialId: jest.fn(),
      createSocialUser: jest.fn(),
      agreeToTerm: jest.fn(),
      updateSignUpStatus: jest.fn(),
      changePassword: jest.fn(),
    } as any;

    // Mock TokenService
    mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      invalidateToken: jest.fn(),
    } as any;

    // Mock constructor
    (UserService as jest.MockedClass<typeof UserService>).mockImplementation(
      () => mockUserService
    );
    (TokenService as unknown as any) = mockTokenService;

    // Mock logger
    const logger = require('../../config/logger.config').default;
    logger.info.mockImplementation(() => {});
    logger.warn.mockImplementation(() => {});
    logger.error.mockImplementation(() => {});
    logger.debug.mockImplementation(() => {});

    authService = new AuthService();
  });

  describe('login', () => {
    const loginData: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedpassword',
      role: 'USER' as const,
      is_admin: false,
      provider: 'LOCAL' as const,
      social_id: null,
      isSignUpCompleted: true,
      created_at: new Date(),
    };

    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    it('✅ 로그인 성공 시 사용자 정보와 토큰을 반환해야 함', async () => {
      // Arrange
      mockUserService.authenticateUser.mockResolvedValue(mockUser);
      mockTokenService.generateAccessToken.mockReturnValue(
        mockTokens.accessToken
      );
      mockTokenService.generateRefreshToken.mockReturnValue(
        mockTokens.refreshToken
      );

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(mockUserService.authenticateUser).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        signUpCompleted: mockUser.isSignUpCompleted,
      });
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        signUpCompleted: mockUser.isSignUpCompleted,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          is_admin: mockUser.is_admin,
          isSignUpCompleted: mockUser.isSignUpCompleted,
        },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('❌ 잘못된 인증 정보로 로그인 실패 시 AuthError를 던져야 함', async () => {
      // Arrange
      mockUserService.authenticateUser.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(AuthError);
      expect(mockUserService.authenticateUser).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );
    });

    it('❌ 인증 과정에서 예외 발생 시 AuthError를 던져야 함', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockUserService.authenticateUser.mockRejectedValue(error);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(AuthError);
    });
  });

  describe('register', () => {
    const registerData: RegisterDto = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      role: 'USER',
    };

    const mockUser = {
      id: 'user-456',
      email: 'newuser@example.com',
      name: 'New User',
      password: 'hashedpassword',
      role: 'USER' as const,
      is_admin: false,
      provider: 'LOCAL' as const,
      social_id: null,
      isSignUpCompleted: true,
      created_at: new Date(),
    };

    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    it('✅ 회원가입 성공 시 사용자 정보와 토큰을 반환해야 함', async () => {
      // Arrange
      mockUserService.validateUser.mockResolvedValue(undefined);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockTokenService.generateAccessToken.mockReturnValue(
        mockTokens.accessToken
      );
      mockTokenService.generateRefreshToken.mockReturnValue(
        mockTokens.refreshToken
      );

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(mockUserService.validateUser).toHaveBeenCalledWith(registerData);
      expect(mockUserService.createUser).toHaveBeenCalledWith(registerData);
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        signUpCompleted: mockUser.isSignUpCompleted,
      });
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        signUpCompleted: mockUser.isSignUpCompleted,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          is_admin: mockUser.is_admin,
          isSignUpCompleted: mockUser.isSignUpCompleted,
        },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('❌ 사용자 검증 실패 시 AuthError를 던져야 함', async () => {
      // Arrange
      const validationError = new AuthError(
        '이미 존재하는 이메일입니다.',
        400,
        'VALIDATION_ERROR'
      );
      mockUserService.validateUser.mockRejectedValue(validationError);

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow(
        AuthError
      );
      expect(mockUserService.validateUser).toHaveBeenCalledWith(registerData);
    });
  });

  describe('logout', () => {
    const token = 'mock-token';

    it('✅ 로그아웃 성공 시 토큰을 무효화해야 함', async () => {
      // Arrange
      mockTokenService.invalidateToken.mockResolvedValue(undefined);

      // Act
      await authService.logout(token);

      // Assert
      expect(mockTokenService.invalidateToken).toHaveBeenCalledWith(token);
    });

    it('❌ 토큰 무효화 실패 시 예외를 던져야 함', async () => {
      // Arrange
      const error = new Error('Token invalidation failed');
      mockTokenService.invalidateToken.mockRejectedValue(error);

      // Act & Assert
      await expect(authService.logout(token)).rejects.toThrow(error);
    });
  });

  describe('changePassword', () => {
    const userId = 'user-123';
    const currentPassword = 'oldpassword';
    const newPassword = 'newpassword';

    const mockUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedpassword',
      role: 'USER' as const,
      is_admin: false,
      provider: 'LOCAL' as const,
      social_id: null,
      isSignUpCompleted: true,
      created_at: new Date(),
    };

    it('✅ 비밀번호 변경 성공 시 true를 반환해야 함', async () => {
      // Arrange
      mockUserService.findById.mockResolvedValue(mockUser);
      mockUserService.authenticateUser.mockResolvedValue(mockUser);
      mockUserService.changePassword.mockResolvedValue(true);

      // Act
      const result = await authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      // Assert
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockUserService.authenticateUser).toHaveBeenCalledWith(
        mockUser.email,
        currentPassword
      );
      expect(mockUserService.changePassword).toHaveBeenCalledWith(
        userId,
        newPassword
      );
      expect(result).toBe(true);
    });

    it('❌ 사용자를 찾을 수 없을 때 AuthError를 던져야 함', async () => {
      // Arrange
      mockUserService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow(AuthError);
    });

    it('❌ 현재 비밀번호가 틀릴 때 AuthError를 던져야 함', async () => {
      // Arrange
      mockUserService.findById.mockResolvedValue(mockUser);
      mockUserService.authenticateUser.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow(AuthError);
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'mock-refresh-token';
    const mockDecoded = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'USER',
      signUpCompleted: true,
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedpassword',
      role: 'USER' as const,
      is_admin: false,
      provider: 'LOCAL' as const,
      social_id: null,
      isSignUpCompleted: true,
      created_at: new Date(),
    };

    const mockNewTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('✅ 토큰 갱신 성공 시 새로운 토큰을 반환해야 함', async () => {
      // Arrange
      mockTokenService.verifyRefreshToken.mockReturnValue(mockDecoded);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockTokenService.generateAccessToken.mockReturnValue(
        mockNewTokens.accessToken
      );
      mockTokenService.generateRefreshToken.mockReturnValue(
        mockNewTokens.refreshToken
      );

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(
        refreshToken
      );
      expect(mockUserService.findById).toHaveBeenCalledWith(mockDecoded.userId);
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        signUpCompleted: mockUser.isSignUpCompleted,
      });
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        signUpCompleted: mockUser.isSignUpCompleted,
      });
      expect(result).toEqual(mockNewTokens);
    });

    it('❌ 사용자를 찾을 수 없을 때 AuthError를 던져야 함', async () => {
      // Arrange
      mockTokenService.verifyRefreshToken.mockReturnValue(mockDecoded);
      mockUserService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        AuthError
      );
    });
  });

  describe('handleSocialLogin', () => {
    const mockProfile = {
      id: 'social-123',
      email: 'social@example.com',
      name: 'Social User',
      provider: 'GOOGLE',
    };

    const mockUser = {
      id: 'user-789',
      email: 'social@example.com',
      name: 'Social User',
      password: null,
      role: 'USER' as const,
      is_admin: false,
      provider: 'GOOGLE' as const,
      social_id: 'social-123',
      isSignUpCompleted: true,
      created_at: new Date(),
    };

    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    it('✅ 기존 소셜 사용자 로그인 성공 시 사용자 정보와 토큰을 반환해야 함', async () => {
      // Arrange
      mockUserService.findBySocialId.mockResolvedValue(mockUser);
      mockTokenService.generateAccessToken.mockReturnValue(
        mockTokens.accessToken
      );
      mockTokenService.generateRefreshToken.mockReturnValue(
        mockTokens.refreshToken
      );

      // Act
      const result = await authService.handleSocialLogin(mockProfile);

      // Assert
      expect(mockUserService.findBySocialId).toHaveBeenCalledWith(
        mockProfile.id,
        mockProfile.provider
      );
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        signUpCompleted: mockUser.isSignUpCompleted,
        provider: mockUser.provider,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          is_admin: mockUser.is_admin,
          provider: mockUser.provider,
          isSignUpCompleted: mockUser.isSignUpCompleted,
        },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('✅ 새로운 소셜 사용자 생성 성공 시 사용자 정보와 토큰을 반환해야 함', async () => {
      // Arrange
      mockUserService.findBySocialId.mockResolvedValue(null);
      mockUserService.createSocialUser.mockResolvedValue(mockUser);
      mockTokenService.generateAccessToken.mockReturnValue(
        mockTokens.accessToken
      );
      mockTokenService.generateRefreshToken.mockReturnValue(
        mockTokens.refreshToken
      );

      // Act
      const result = await authService.handleSocialLogin(mockProfile);

      // Assert
      expect(mockUserService.findBySocialId).toHaveBeenCalledWith(
        mockProfile.id,
        mockProfile.provider
      );
      expect(mockUserService.createSocialUser).toHaveBeenCalledWith({
        email: mockProfile.email,
        name: mockProfile.name,
        provider: mockProfile.provider,
        social_id: mockProfile.id,
        isSignUpCompleted: false,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          is_admin: mockUser.is_admin,
          provider: mockUser.provider,
          isSignUpCompleted: mockUser.isSignUpCompleted,
        },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });
  });

  describe('completeSignUp', () => {
    const userId = 'user-123';
    const termIds = ['term-1', 'term-2'];

    const mockUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      password: null,
      role: 'USER' as const,
      is_admin: false,
      provider: 'GOOGLE' as const,
      social_id: 'social-123',
      isSignUpCompleted: true,
      created_at: new Date(),
    };

    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    it('✅ 회원가입 완료 성공 시 사용자 정보와 토큰을 반환해야 함', async () => {
      // Arrange
      mockUserService.agreeToTerm.mockResolvedValue(undefined);
      mockUserService.updateSignUpStatus.mockResolvedValue(mockUser);
      mockTokenService.generateAccessToken.mockReturnValue(
        mockTokens.accessToken
      );
      mockTokenService.generateRefreshToken.mockReturnValue(
        mockTokens.refreshToken
      );

      // Act
      const result = await authService.completeSignUp(userId, termIds);

      // Assert
      expect(mockUserService.agreeToTerm).toHaveBeenCalledTimes(2);
      expect(mockUserService.agreeToTerm).toHaveBeenCalledWith(
        userId,
        'term-1'
      );
      expect(mockUserService.agreeToTerm).toHaveBeenCalledWith(
        userId,
        'term-2'
      );
      expect(mockUserService.updateSignUpStatus).toHaveBeenCalledWith(
        userId,
        true
      );
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        signUpCompleted: true,
        provider: mockUser.provider,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          is_admin: mockUser.is_admin,
          provider: mockUser.provider,
          isSignUpCompleted: true,
        },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });
  });
});
