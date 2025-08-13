import { Request, Response } from 'express';
import { AuthController } from '../../domains/auth/auth.controller';
import { AuthService } from '../../domains/auth/auth.service';
import { AuthError } from '../../common/exception/auth/AuthError';
import { AuthenticatedRequest } from '../../types/express';

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
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

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

    authController = new AuthController(mockPrisma);
  });

  describe('login', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockLoginResult = {
      user: {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isAdmin: false,
        isSignUpCompleted: true,
        provider: 'LOCAL',
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
      mockAuthService.login.mockResolvedValue(mockLoginResult as any);

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
        message: `로그인이 성공적으로 완료되었습니다. (사용자 ID: 550e8400-e29b-41d4-a716-446655440001, 역할: USER)`,
        code: 'LOGIN_SUCCESS',
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
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
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '잘못된 인증 정보입니다.',
        },
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
        error: {
          code: 'INTERNAL_ERROR',
          message: '로그인 처리 중 오류가 발생했습니다.',
        },
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
        userId: '550e8400-e29b-41d4-a716-446655440002',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'USER',
        isAdmin: false,
        isSignUpCompleted: true,
        provider: 'LOCAL',
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
      mockAuthService.register.mockResolvedValue(mockRegisterResult as any);

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
        message: `로그인이 성공적으로 완료되었습니다. (사용자 ID: 550e8400-e29b-41d4-a716-446655440002, 역할: USER)`,
        code: 'LOGIN_SUCCESS',
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
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
        error: {
          code: 'EMAIL_EXISTS',
          message: '이미 존재하는 이메일입니다.',
        },
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
        userId: 'user-789',
        email: 'social@example.com',
        name: 'Social User',
        role: 'USER',
        isAdmin: false,
        provider: 'GOOGLE',
        isSignUpCompleted: false,
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
        mockSocialData
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockSocialResult,
        message: `로그인이 성공적으로 완료되었습니다. (사용자 ID: user-789, 역할: USER)`,
        code: 'LOGIN_SUCCESS',
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
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
        mockSocialData
      );
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SOCIAL_LOGIN_FAILED',
          message: '소셜 로그인 처리 중 오류가 발생했습니다.',
        },
      });
    });
  });

  describe('completeSignUp', () => {
    const mockCompleteSignUpData = {
      termIds: ['term-1', 'term-2'],
    };

    const mockCompleteSignUpResult = {
      user: {
        userId: 'user-789',
        email: 'social@example.com',
        name: 'Social User',
        role: 'USER',
        isAdmin: false,
        provider: 'GOOGLE',
        isSignUpCompleted: true,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    beforeEach(() => {
      mockRequest = {
        body: mockCompleteSignUpData,
        user: {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'USER',
          isAdmin: false,
          signUpCompleted: true,
        },
      };
    });

    it('✅ 회원가입 완료 성공 시 200 상태와 결과를 반환해야 함', async () => {
      // Arrange
      mockAuthService.completeSignUp.mockResolvedValue(
        mockCompleteSignUpResult
      );

      // Act
      await authController.completeSignUp(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.completeSignUp).toHaveBeenCalledWith(
        'user-123',
        mockCompleteSignUpData.termIds
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCompleteSignUpResult,
        message: `로그인이 성공적으로 완료되었습니다. (사용자 ID: user-789, 역할: USER)`,
        code: 'LOGIN_SUCCESS',
      });
    });

    it('❌ 사용자 인증이 없을 때 401 상태를 반환해야 함', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await authController.completeSignUp(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.completeSignUp).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다.',
        },
      });
    });

    it('❌ termIds가 없을 때 400 상태를 반환해야 함', async () => {
      // Arrange
      const authError = new AuthError(
        '약관 ID 목록이 필요합니다.',
        400,
        'INVALID_TERM_IDS'
      );
      mockAuthService.completeSignUp.mockRejectedValue(authError);

      // Act
      await authController.completeSignUp(
        mockRequest as AuthenticatedRequest,
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
        error: {
          code: 'INVALID_TERM_IDS',
          message: '약관 ID 목록이 필요합니다.',
        },
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
        mockRequest as AuthenticatedRequest,
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
        error: {
          code: 'REGISTRATION_FAILED',
          message: '회원가입 완료 처리 중 오류가 발생했습니다.',
        },
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
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: '로그아웃이 성공적으로 완료되었습니다.',
        code: 'LOGOUT_SUCCESS',
      });
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
        data: null,
        message: '로그아웃이 성공적으로 완료되었습니다.',
        code: 'LOGOUT_SUCCESS',
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
        error: {
          code: 'INTERNAL_ERROR',
          message: '로그아웃 처리 중 오류가 발생했습니다.',
        },
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
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockRefreshResult,
        message: `토큰이 성공적으로 갱신되었습니다. (만료 시간: 3600초)`,
        code: 'TOKEN_REFRESH_SUCCESS',
      });
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
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: '토큰 갱신 중 오류가 발생했습니다.',
        },
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
        user: {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'USER',
          isAdmin: false,
          signUpCompleted: true,
        },
      };
    });

    it('✅ 비밀번호 변경 성공 시 200 상태와 성공 메시지를 반환해야 함', async () => {
      // Arrange
      mockAuthService.changePassword.mockResolvedValue(true);

      // Act
      await authController.changePassword(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        'user-123',
        mockChangePasswordData.currentPassword,
        mockChangePasswordData.newPassword
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: null,
        message:
          '비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요.',
        code: 'PASSWORD_CHANGE_SUCCESS',
      });
    });

    it('❌ 사용자 인증이 없을 때 401 상태를 반환해야 함', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await authController.changePassword(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.changePassword).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다.',
        },
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
        mockRequest as AuthenticatedRequest,
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
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '현재 비밀번호가 일치하지 않습니다.',
        },
      });
    });
  });
});
