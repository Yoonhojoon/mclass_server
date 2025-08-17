import { Request, Response, NextFunction } from 'express';

import {
  authenticateToken,
  requireSignUpCompleted,
} from '../../middleware/auth.middleware';
import { AuthenticatedRequest } from '../../types/express';
import { TokenService } from '../../domains/token/token.service';

// Mock dependencies
jest.mock('../../config/logger.config', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ES 모듈 mock 설정
jest.mock('../../domains/token/token.service.js');

jest.mock('../../services/redis/token-storage.service', () => ({
  TokenStorageService: {
    isTokenValid: jest.fn(),
  },
}));

jest.mock('../../config/passport.config', () => ({
  __esModule: true,
  default: {
    authenticate: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response> & {
    status: jest.MockedFunction<Response['status']>;
    json: jest.MockedFunction<Response['json']>;
  };
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock logger
    const logger = require('../../config/logger.config').default;
    logger.info.mockImplementation(() => {});
    logger.warn.mockImplementation(() => {});
    logger.error.mockImplementation(() => {});
    logger.debug.mockImplementation(() => {});

    // Mock TokenService - 동일 모듈 인스턴스 참조
    (
      TokenService.verifyAccessTokenWithBlacklist as jest.Mock
    ).mockResolvedValue({
      userId: 'user-123',
      email: 'test@example.com',
      role: 'USER',
      isAdmin: false,
      signUpCompleted: true,
      provider: 'local',
    });

    // Mock TokenStorageService
    const tokenStorageService = require('../../services/redis/token-storage.service');
    tokenStorageService.TokenStorageService.isTokenValid = jest
      .fn()
      .mockResolvedValue(true);

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('authenticateToken', () => {
    const mockToken = 'valid-jwt-token';
    const mockDecodedToken = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'USER',
      isAdmin: false,
      signUpCompleted: true,
      provider: 'local',
    };
    beforeEach(() => {
      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };
    });

    it('✅ 유효한 토큰으로 인증 성공 시 next()를 호출해야 함', async () => {
      // Arrange
      (
        TokenService.verifyAccessTokenWithBlacklist as jest.Mock
      ).mockResolvedValue(mockDecodedToken);

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(TokenService.verifyAccessTokenWithBlacklist).toHaveBeenCalledWith(
        mockToken
      );
      expect(mockRequest.user).toMatchObject(mockDecodedToken);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('❌ 토큰이 없을 때 401 상태를 반환해야 함', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = mockNext.mock.calls[0][0] as any;
      expect(error.message).toBe('인증 토큰이 필요합니다.');
      expect(error.errorCode).toBe('AUTHENTICATION_FAILED');
    });

    it('❌ 잘못된 토큰 형식일 때 401 상태를 반환해야 함', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidToken',
      };

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = mockNext.mock.calls[0][0] as any;
      expect(error.message).toBe('인증 토큰이 필요합니다.');
      expect(error.errorCode).toBe('AUTHENTICATION_FAILED');
    });

    it('❌ 토큰 검증 실패 시 401 상태를 반환해야 함', async () => {
      // Arrange
      (
        TokenService.verifyAccessTokenWithBlacklist as jest.Mock
      ).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = mockNext.mock.calls[0][0] as any;
      expect(error.message).toBe('유효하지 않은 토큰입니다.');
      expect(error.errorCode).toBe('AUTHENTICATION_FAILED');
    });

    it('❌ 만료된 토큰일 때 401 상태를 반환해야 함', async () => {
      // Arrange
      (
        TokenService.verifyAccessTokenWithBlacklist as jest.Mock
      ).mockImplementation(() => {
        const error = new Error('jwt expired');
        (error as any).name = 'TokenExpiredError';
        throw error;
      });

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = mockNext.mock.calls[0][0] as any;
      expect(error.message).toBe('유효하지 않은 토큰입니다.');
      expect(error.errorCode).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('requireSignUpCompleted', () => {
    beforeEach(() => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
        isAdmin: false,
        signUpCompleted: false,
      };
    });

    it('✅ 회원가입이 완료된 사용자는 next()를 호출해야 함', async () => {
      // Arrange
      mockRequest.user!.signUpCompleted = true;

      // Act
      await requireSignUpCompleted(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('❌ 회원가입이 완료되지 않은 사용자는 403 상태를 반환해야 함', async () => {
      // Arrange
      mockRequest.user = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
        isAdmin: false,
        signUpCompleted: false,
      };

      // Act
      await requireSignUpCompleted(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = mockNext.mock.calls[0][0] as any;
      expect(error.message).toBe('서비스에 대한 이용 권한이 없습니다.');
      expect(error.errorCode).toBe('PERMISSION_DENIED');
    });

    it('❌ 사용자 정보가 없을 때 401 상태를 반환해야 함', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await requireSignUpCompleted(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = mockNext.mock.calls[0][0] as any;
      expect(error.message).toBe('인증이 필요합니다.');
      expect(error.errorCode).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('미들웨어 체인 테스트', () => {
    it('✅ authenticateToken과 requireSignUpCompleted가 함께 작동해야 함', async () => {
      // Arrange
      const mockToken = 'valid-jwt-token';
      const mockDecodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
        isAdmin: false,
        signUpCompleted: true,
        provider: 'local',
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      (
        TokenService.verifyAccessTokenWithBlacklist as jest.Mock
      ).mockResolvedValue(mockDecodedToken);

      // Act - authenticateToken 실행
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert - authenticateToken이 성공했는지 확인
      expect(mockRequest.user).toMatchObject(mockDecodedToken);
      expect(mockNext).toHaveBeenCalled();

      // Reset mockNext
      mockNext.mockClear();

      // Act - requireSignUpCompleted 실행
      await requireSignUpCompleted(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert - requireSignUpCompleted가 성공했는지 확인
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('❌ 인증 실패 후 회원가입 완료 체크가 실행되지 않아야 함', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act - authenticateToken 실행 (실패)
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert - authenticateToken이 실패했는지 확인
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = mockNext.mock.calls[0][0] as any;
      expect(error.message).toBe('인증 토큰이 필요합니다.');
      expect(error.errorCode).toBe('AUTHENTICATION_FAILED');

      // Reset mocks
      mockResponse.status.mockClear();
      mockResponse.json.mockClear();
      mockNext.mockClear();

      // Act - requireSignUpCompleted 실행 (실행되지 않아야 함)
      await requireSignUpCompleted(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert - requireSignUpCompleted가 실행되었지만 인증 실패로 인해 에러가 발생했는지 확인
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const secondError = mockNext.mock.calls[0][0] as any;
      expect(secondError.message).toBe('인증이 필요합니다.');
      expect(secondError.errorCode).toBe('AUTHENTICATION_FAILED');
    });
  });
});
