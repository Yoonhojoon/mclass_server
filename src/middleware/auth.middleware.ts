import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../common/exception/auth/AuthError.js';
import { TokenService } from '../domains/token/token.service.js';
import logger from '../config/logger.config.js';

// AuthenticatedRequest 인터페이스 제거 - 전역 타입으로 대체

/**
 * JWT 토큰 인증 미들웨어 (기존 호환성을 위해 유지)
 * @deprecated jwtAuth와 requireAuth를 사용하세요
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn(`[AuthMiddleware] 인증 토큰 없음: ${req.method} ${req.path}`);
      throw AuthError.authenticationFailed('인증 토큰이 필요합니다.');
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn(
        `[AuthMiddleware] 잘못된 토큰 형식: ${req.method} ${req.path}`
      );
      throw AuthError.authenticationFailed('인증 토큰이 필요합니다.');
    }

    try {
      const decoded = TokenService.verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        isAdmin: decoded.isAdmin,
        signUpCompleted: decoded.signUpCompleted,
        provider: decoded.provider,
      };

      logger.debug(
        `[AuthMiddleware] 토큰 인증 성공: 사용자 ID ${req.user.userId}, 경로 ${req.method} ${req.path}`
      );
      next();
    } catch (tokenError) {
      logger.warn(
        `[AuthMiddleware] 토큰 검증 실패: ${req.method} ${req.path}`,
        {
          error: tokenError instanceof Error ? tokenError.message : tokenError,
        }
      );

      // 일관된 에러 처리를 위해 AuthError로 래핑
      if (tokenError instanceof AuthError) {
        next(tokenError);
      } else {
        next(AuthError.authenticationFailed('유효하지 않은 토큰입니다.'));
      }
    }
  } catch (error) {
    logger.warn(`[AuthMiddleware] 토큰 인증 실패: ${req.method} ${req.path}`, {
      error: error instanceof Error ? error.message : error,
    });

    // 일관된 에러 처리를 위해 AuthError로 래핑
    if (error instanceof AuthError) {
      next(error);
    } else {
      next(AuthError.authenticationFailed('인증에 실패했습니다.'));
    }
  }
};

/**
 * 회원가입 완료 확인 미들웨어
 */
export const requireSignUpCompleted = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      logger.warn(
        `[AuthMiddleware] 회원가입 완료 확인 실패: 인증되지 않은 사용자, 경로 ${req.method} ${req.path}`
      );
      throw AuthError.authenticationFailed('인증이 필요합니다.');
    }

    if (!req.user.signUpCompleted) {
      logger.warn(
        `[AuthMiddleware] 회원가입 미완료 사용자 접근 시도: 사용자 ID ${req.user.userId}, 경로 ${req.method} ${req.path}`
      );
      throw AuthError.permissionDenied('서비스', '이용');
    }

    logger.debug(
      `[AuthMiddleware] 회원가입 완료 확인 성공: 사용자 ID ${req.user.userId}, 경로 ${req.method} ${req.path}`
    );
    next();
  } catch (error) {
    logger.warn(
      `[AuthMiddleware] 회원가입 완료 확인 실패: ${req.method} ${req.path}`,
      { error: error instanceof Error ? error.message : error }
    );

    // 일관된 에러 처리를 위해 AuthError로 래핑
    if (error instanceof AuthError) {
      next(error);
    } else {
      next(AuthError.authenticationFailed('인증에 실패했습니다.'));
    }
  }
};

/**
 * 관리자 권한 확인 미들웨어
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      logger.warn(
        `[AuthMiddleware] 관리자 권한 확인 실패: 인증되지 않은 사용자, 경로 ${req.method} ${req.path}`
      );
      throw AuthError.authenticationFailed('인증이 필요합니다.');
    }

    if (!req.user.isAdmin) {
      logger.warn(
        `[AuthMiddleware] 관리자 권한 없는 사용자 접근 시도: 사용자 ID ${req.user.userId}, 경로 ${req.method} ${req.path}`
      );
      throw AuthError.permissionDenied('관리자 기능', '접근');
    }

    logger.debug(
      `[AuthMiddleware] 관리자 권한 확인 성공: 사용자 ID ${req.user.userId}, 경로 ${req.method} ${req.path}`
    );
    next();
  } catch (error) {
    logger.warn(
      `[AuthMiddleware] 관리자 권한 확인 실패: ${req.method} ${req.path}`,
      { error: error instanceof Error ? error.message : error }
    );

    // 일관된 에러 처리를 위해 AuthError로 래핑
    if (error instanceof AuthError) {
      next(error);
    } else {
      next(AuthError.authenticationFailed('인증에 실패했습니다.'));
    }
  }
};
