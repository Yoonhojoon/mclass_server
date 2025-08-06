import { AuthController } from '../../domains/auth/auth.controller';
import { AuthError } from '../../common/exception/auth/AuthError';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

// Mock external dependencies only
jest.mock('../../config/logger.config', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock database and external services
jest.mock('../../domains/user/user.service');
jest.mock('../../domains/token/token.service');
jest.mock('../../config/prisma.config', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    term: {
      findMany: jest.fn(),
    },
    userTerm: {
      createMany: jest.fn(),
    },
  },
}));

describe('Auth API Integration Tests', () => {
  let authController: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock logger
    const logger = require('../../config/logger.config').default;
    logger.info.mockImplementation(() => {});
    logger.warn.mockImplementation(() => {});
    logger.error.mockImplementation(() => {});
    logger.debug.mockImplementation(() => {});

    // Create auth controller instance
    authController = new AuthController();
  });

  describe('POST /api/auth/login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('✅ 로그인 성공 시 200 상태와 결과를 반환해야 함', async () => {
      // Arrange - Mock AuthService
      const mockAuthService = (
        authController as unknown as { authService: any }
      ).authService;
      const mockLoginResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
          isAdmin: false,
          isSignUpCompleted: true,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockAuthService.login = jest.fn().mockResolvedValue(mockLoginResult);

      // Create mock request and response
      const mockRequest = {
        body: loginData,
      } as unknown as Request;

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      // Act
      await authController.login(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockLoginResult,
        message: `로그인이 성공적으로 완료되었습니다. (사용자 ID: user-123, 역할: USER)`,
      });
    });

    it('❌ AuthError 발생 시 400 상태와 에러 메시지를 반환해야 함', async () => {
      // Arrange - Mock AuthService to throw error
      const mockAuthService = (
        authController as unknown as { authService: any }
      ).authService;
      const authError = new AuthError(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
        400,
        'INVALID_CREDENTIALS'
      );
      mockAuthService.login = jest.fn().mockRejectedValue(authError);

      // Create mock request and response
      const mockRequest = {
        body: loginData,
      } as unknown as Request;

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      // Act
      await authController.login(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        },
      });
    });
  });

  describe('POST /api/auth/register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      role: 'USER',
    };

    it('✅ 회원가입 성공 시 200 상태와 결과를 반환해야 함', async () => {
      // Arrange - Mock AuthService
      const mockAuthService = (
        authController as unknown as { authService: any }
      ).authService;
      const mockRegisterResult = {
        user: {
          id: 'user-456',
          email: registerData.email,
          name: registerData.name,
          role: registerData.role,
          isAdmin: false,
          isSignUpCompleted: false,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockAuthService.register = jest
        .fn()
        .mockResolvedValue(mockRegisterResult);

      // Create mock request and response
      const mockRequest = {
        body: registerData,
      } as unknown as Request;

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      // Act
      await authController.register(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockRegisterResult,
        message: `로그인이 성공적으로 완료되었습니다. (사용자 ID: user-456, 역할: USER)`,
      });
    });

    it('❌ AuthError 발생 시 400 상태와 에러 메시지를 반환해야 함', async () => {
      // Arrange - Mock AuthService to throw error
      const mockAuthService = (
        authController as unknown as { authService: any }
      ).authService;
      const authError = new AuthError(
        '이미 존재하는 이메일입니다.',
        400,
        'EMAIL_EXISTS'
      );
      mockAuthService.register = jest.fn().mockRejectedValue(authError);

      // Create mock request and response
      const mockRequest = {
        body: registerData,
      } as unknown as Request;

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      // Act
      await authController.register(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: '이미 존재하는 이메일입니다.',
        },
      });
    });
  });

  describe('Auth Controller Direct Tests', () => {
    describe('POST /api/auth/complete-signup', () => {
      const completeSignUpData = {
        termIds: ['term-1', 'term-2'],
      };

      it('✅ 회원가입 완료 성공 시 200 상태와 결과를 반환해야 함', async () => {
        // Arrange - Mock AuthService
        const mockAuthService = (
          authController as unknown as { authService: any }
        ).authService;
        const mockCompleteSignUpResult = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER',
            isAdmin: false,
            isSignUpCompleted: true,
            provider: 'GOOGLE',
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        };

        mockAuthService.completeSignUp = jest
          .fn()
          .mockResolvedValue(mockCompleteSignUpResult);

        // Create mock request and response
        const mockRequest = {
          body: completeSignUpData,
          user: {
            userId: 'user-123',
            email: 'test@example.com',
            role: 'USER',
            signUpCompleted: true,
          },
        } as unknown as AuthenticatedRequest;

        const mockResponse = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        // Act
        await authController.completeSignUp(mockRequest, mockResponse);

        // Assert
        expect(mockAuthService.completeSignUp).toHaveBeenCalledWith(
          'user-123',
          completeSignUpData.termIds
        );
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: mockCompleteSignUpResult,
          message:
            '로그인이 성공적으로 완료되었습니다. (사용자 ID: user-123, 역할: USER)',
        });
      });

      it('❌ 사용자 인증이 없을 때 401 상태를 반환해야 함', async () => {
        // Create mock request and response
        const mockRequest = {
          body: completeSignUpData,
          user: undefined,
        } as unknown as AuthenticatedRequest;

        const mockResponse = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        // Act
        await authController.completeSignUp(mockRequest, mockResponse);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          },
        });
      });

      it('❌ INVALID_TERM_IDS 에러 발생 시 400 상태를 반환해야 함', async () => {
        // Arrange - Mock AuthService to throw error
        const mockAuthService = (
          authController as unknown as { authService: any }
        ).authService;
        const authError = new AuthError(
          '약관 ID 목록이 필요합니다.',
          400,
          'INVALID_TERM_IDS'
        );
        mockAuthService.completeSignUp = jest.fn().mockRejectedValue(authError);

        // Create mock request and response
        const mockRequest = {
          body: completeSignUpData,
          user: {
            userId: 'user-123',
            email: 'test@example.com',
            role: 'USER',
            signUpCompleted: true,
          },
        } as unknown as AuthenticatedRequest;

        const mockResponse = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        // Act
        await authController.completeSignUp(mockRequest, mockResponse);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INVALID_TERM_IDS',
            message: '약관 ID 목록이 필요합니다.',
          },
        });
      });
    });

    describe('PUT /api/auth/change-password', () => {
      const changePasswordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      it('✅ 비밀번호 변경 성공 시 200 상태와 성공 메시지를 반환해야 함', async () => {
        // Arrange - Mock AuthService
        const mockAuthService = (
          authController as unknown as { authService: any }
        ).authService;
        mockAuthService.changePassword = jest.fn().mockResolvedValue(true);

        // Create mock request and response
        const mockRequest = {
          body: changePasswordData,
          user: {
            userId: 'user-123',
            email: 'test@example.com',
            role: 'USER',
            signUpCompleted: true,
          },
        } as unknown as AuthenticatedRequest;

        const mockResponse = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        // Act
        await authController.changePassword(mockRequest, mockResponse);

        // Assert
        expect(mockAuthService.changePassword).toHaveBeenCalledWith(
          'user-123',
          changePasswordData.currentPassword,
          changePasswordData.newPassword
        );
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: null,
          message:
            '비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요.',
        });
      });

      it('❌ 사용자 인증이 없을 때 401 상태를 반환해야 함', async () => {
        // Create mock request and response
        const mockRequest = {
          body: changePasswordData,
          user: undefined,
        } as unknown as AuthenticatedRequest;

        const mockResponse = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        // Act
        await authController.changePassword(mockRequest, mockResponse);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          },
        });
      });
    });
  });
});
