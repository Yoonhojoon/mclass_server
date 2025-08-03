import { Request, Response } from 'express';
import { AuthController } from '../../domains/auth/auth.controller';
import { AuthService } from '../../domains/auth/auth.service';
import { AuthError } from '../../common/exception/auth/AuthError';

// Mock dependencies
jest.mock('../../domains/auth/auth.service');
jest.mock('../../config/logger.config', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AuthService
    mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      socialLogin: jest.fn(),
      completeSignUp: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      changePassword: jest.fn(),
      handleSocialLogin: jest.fn(),
    } as any;

    // Mock constructor
    (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
      () => mockAuthService
    );

    // Mock logger
    const logger = require('../../config/logger.config').default;
    logger.info.mockImplementation(() => {});
    logger.warn.mockImplementation(() => {});
    logger.error.mockImplementation(() => {});
    logger.debug.mockImplementation(() => {});

    // Mock response methods
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    authController = new AuthController();
  });

  describe('login', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockLoginResult = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        is_admin: false,
        isSignUpCompleted: true,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    beforeEach(() => {
      mockRequest = {
        body: mockLoginData,
      };
    });

    it('✅ 로그인 성공 시 200 상태와 결과를 반환해야 함', async () => {
      // Arrange
      mockAuthService.login.mockResolvedValue(mockLoginResult);

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(mockLoginData);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockLoginResult,
      });
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('❌ AuthError 발생 시 400 상태와 에러 메시지를 반환해야 함', async () => {
      // Arrange
      const authError = new AuthError(
        '잘못된 인증 정보입니다.',
        400,
        'INVALID_CREDENTIALS'
      );
      mockAuthService.login.mockRejectedValue(authError);

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(mockLoginData);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: authError.name,
        message: authError.message,
      });
    });

    it('❌ 일반 에러 발생 시 500 상태와 에러 메시지를 반환해야 함', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockAuthService.login.mockRejectedValue(error);

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(mockLoginData);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '로그인 처리 중 오류가 발생했습니다.',
      });
    });
  });

  describe('register', () => {
    const mockRegisterData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      role: 'USER',
    };

    const mockRegisterResult = {
      user: {
        id: 'user-456',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'USER',
        is_admin: false,
        isSignUpCompleted: true,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    beforeEach(() => {
      mockRequest = {
        body: mockRegisterData,
      };
    });

    it('✅ 회원가입 성공 시 200 상태와 결과를 반환해야 함', async () => {
      // Arrange
      mockAuthService.register.mockResolvedValue(mockRegisterResult);

      // Act
      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(mockRegisterData);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockRegisterResult,
      });
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('❌ AuthError 발생 시 400 상태와 에러 메시지를 반환해야 함', async () => {
      // Arrange
      const authError = new AuthError(
        '이미 존재하는 이메일입니다.',
        400,
        'EMAIL_EXISTS'
      );
      mockAuthService.register.mockRejectedValue(authError);

      // Act
      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(mockRegisterData);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: authError.name,
        message: authError.message,
      });
    });
  });

  describe('socialLogin', () => {
    const mockSocialData = {
      profile: {
        id: 'social-123',
        email: 'social@example.com',
        name: 'Social User',
        provider: 'GOOGLE',
      },
    };

    const mockSocialResult = {
      user: {
        id: 'user-789',
        email: 'social@example.com',
        name: 'Social User',
        role: 'USER',
        is_admin: false,
        provider: 'GOOGLE',
        isSignUpCompleted: true,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    beforeEach(() => {
      mockRequest = {
        body: mockSocialData,
      };
    });

    it('✅ 소셜 로그인 성공 시 200 상태와 결과를 반환해야 함', async () => {
      // Arrange
      mockAuthService.handleSocialLogin.mockResolvedValue(mockSocialResult);

      // Act
      await authController.socialLogin(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.handleSocialLogin).toHaveBeenCalledWith(
        mockSocialData.profile
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockSocialResult,
      });
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('❌ AuthError 발생 시 400 상태와 에러 메시지를 반환해야 함', async () => {
      // Arrange
      const authError = new AuthError(
        '소셜 로그인 처리 중 오류가 발생했습니다.',
        400,
        'SOCIAL_LOGIN_FAILED'
      );
      mockAuthService.handleSocialLogin.mockRejectedValue(authError);

      // Act
      await authController.socialLogin(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.handleSocialLogin).toHaveBeenCalledWith(
        mockSocialData.profile
      );
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: authError.name,
        message: authError.message,
      });
    });
  });

  describe('completeSignUp', () => {
    const mockCompleteSignUpData = {
      termIds: ['term-1', 'term-2'],
    };

    const mockCompleteSignUpResult = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        is_admin: false,
        provider: 'GOOGLE',
        isSignUpCompleted: true,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    beforeEach(() => {
      mockRequest = {
        body: mockCompleteSignUpData,
        user: { userId: 'user-123' },
      };
    });

    it('✅ 회원가입 완료 성공 시 200 상태와 결과를 반환해야 함', async () => {
      // Arrange
      mockAuthService.completeSignUp.mockResolvedValue(
        mockCompleteSignUpResult
      );

      // Act
      await authController.completeSignUp(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.completeSignUp).toHaveBeenCalledWith(
        'user-123',
        mockCompleteSignUpData.termIds
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCompleteSignUpResult,
      });
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('❌ 사용자 인증이 없을 때 401 상태를 반환해야 함', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await authController.completeSignUp(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.completeSignUp).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: '인증이 필요합니다.',
      });
    });

    it('❌ termIds가 없을 때 400 상태를 반환해야 함', async () => {
      // Arrange
      mockRequest.body = {};

      // Act
      await authController.completeSignUp(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.completeSignUp).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'INVALID_TERM_IDS',
        message: '약관 ID 목록이 필요합니다.',
      });
    });

    it('❌ AuthError 발생 시 400 상태와 에러 메시지를 반환해야 함', async () => {
      // Arrange
      const authError = new AuthError(
        '회원가입 완료 처리 중 오류가 발생했습니다.',
        400,
        'REGISTRATION_FAILED'
      );
      mockAuthService.completeSignUp.mockRejectedValue(authError);

      // Act
      await authController.completeSignUp(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.completeSignUp).toHaveBeenCalledWith(
        'user-123',
        mockCompleteSignUpData.termIds
      );
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: authError.name,
        message: authError.message,
      });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      mockRequest = {
        headers: {
          authorization: 'Bearer mock-token',
        },
      };
    });

    it('✅ 로그아웃 성공 시 200 상태와 성공 메시지를 반환해야 함', async () => {
      // Arrange
      mockAuthService.logout.mockResolvedValue(undefined);

      // Act
      await authController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith('mock-token');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '로그아웃되었습니다.',
      });
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('✅ 토큰이 없어도 성공 메시지를 반환해야 함', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '로그아웃되었습니다.',
      });
    });

    it('❌ 에러 발생 시 500 상태와 에러 메시지를 반환해야 함', async () => {
      // Arrange
      const error = new Error('Logout failed');
      mockAuthService.logout.mockRejectedValue(error);

      // Act
      await authController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith('mock-token');
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '로그아웃 처리 중 오류가 발생했습니다.',
      });
    });
  });

  describe('refreshToken', () => {
    const mockRefreshData = {
      refreshToken: 'mock-refresh-token',
    };

    const mockRefreshResult = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    beforeEach(() => {
      mockRequest = {
        body: mockRefreshData,
      };
    });

    it('✅ 토큰 갱신 성공 시 200 상태와 결과를 반환해야 함', async () => {
      // Arrange
      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResult);

      // Act
      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        mockRefreshData.refreshToken
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockRefreshResult,
      });
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('❌ AuthError 발생 시 400 상태와 에러 메시지를 반환해야 함', async () => {
      // Arrange
      const authError = new AuthError(
        '토큰 갱신 중 오류가 발생했습니다.',
        400,
        'TOKEN_REFRESH_FAILED'
      );
      mockAuthService.refreshToken.mockRejectedValue(authError);

      // Act
      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        mockRefreshData.refreshToken
      );
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: authError.name,
        message: authError.message,
      });
    });
  });

  describe('changePassword', () => {
    const mockChangePasswordData = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword',
    };

    beforeEach(() => {
      mockRequest = {
        body: mockChangePasswordData,
        user: { userId: 'user-123' },
      };
    });

    it('✅ 비밀번호 변경 성공 시 200 상태와 성공 메시지를 반환해야 함', async () => {
      // Arrange
      mockAuthService.changePassword.mockResolvedValue(true);

      // Act
      await authController.changePassword(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        'user-123',
        mockChangePasswordData.currentPassword,
        mockChangePasswordData.newPassword
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '비밀번호가 변경되었습니다.',
      });
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('❌ 사용자 인증이 없을 때 401 상태를 반환해야 함', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await authController.changePassword(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.changePassword).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: '인증이 필요합니다.',
      });
    });

    it('❌ AuthError 발생 시 400 상태와 에러 메시지를 반환해야 함', async () => {
      // Arrange
      const authError = new AuthError(
        '현재 비밀번호가 일치하지 않습니다.',
        400,
        'INVALID_CREDENTIALS'
      );
      mockAuthService.changePassword.mockRejectedValue(authError);

      // Act
      await authController.changePassword(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        'user-123',
        mockChangePasswordData.currentPassword,
        mockChangePasswordData.newPassword
      );
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: authError.name,
        message: authError.message,
      });
    });
  });
});
