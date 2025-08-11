import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../domains/token/token.service.js';
import { AuthError } from '../common/exception/auth/AuthError.js';
import logger from '../config/logger.config.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    isAdmin: boolean;
    signUpCompleted: boolean;
    provider?: string;
  };
}

/**
 * JWT 토큰 인증 미들웨어
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

    const decoded = TokenService.verifyAccessToken(token);
    (req as AuthenticatedRequest).user = decoded;

    logger.debug(
      `[AuthMiddleware] 토큰 인증 성공: 사용자 ID ${decoded.userId}, 경로 ${req.method} ${req.path}`
    );
    next();
  } catch (error) {
    logger.warn(`[AuthMiddleware] 토큰 인증 실패: ${req.method} ${req.path}`, {
      error: error instanceof Error ? error.message : error,
    });
    next(error);
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
    if (!(req as AuthenticatedRequest).user) {
      logger.warn(
        `[AuthMiddleware] 회원가입 완료 확인 실패: 인증되지 않은 사용자, 경로 ${req.method} ${req.path}`
      );
      throw AuthError.authenticationFailed('인증이 필요합니다.');
    }

    if (!(req as AuthenticatedRequest).user?.signUpCompleted) {
      logger.warn(
        `[AuthMiddleware] 회원가입 미완료 사용자 접근 시도: 사용자 ID ${(req as AuthenticatedRequest).user?.userId}, 경로 ${req.method} ${req.path}`
      );
      throw AuthError.permissionDenied('서비스', '이용');
    }

    logger.debug(
      `[AuthMiddleware] 회원가입 완료 확인 성공: 사용자 ID ${(req as AuthenticatedRequest).user?.userId}, 경로 ${req.method} ${req.path}`
    );
    next();
  } catch (error) {
    logger.warn(
      `[AuthMiddleware] 회원가입 완료 확인 실패: ${req.method} ${req.path}`,
      { error: error instanceof Error ? error.message : error }
    );
    next(error);
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
    if (!(req as AuthenticatedRequest).user) {
      logger.warn(
        `[AuthMiddleware] 관리자 권한 확인 실패: 인증되지 않은 사용자, 경로 ${req.method} ${req.path}`
      );
      throw AuthError.authenticationFailed('인증이 필요합니다.');
    }

    if (!(req as AuthenticatedRequest).user?.isAdmin) {
      logger.warn(
        `[AuthMiddleware] 관리자 권한 없는 사용자 접근 시도: 사용자 ID ${(req as AuthenticatedRequest).user?.userId}, 경로 ${req.method} ${req.path}`
      );
      throw AuthError.permissionDenied('관리자 기능', '접근');
    }

    logger.debug(
      `[AuthMiddleware] 관리자 권한 확인 성공: 사용자 ID ${(req as AuthenticatedRequest).user?.userId}, 경로 ${req.method} ${req.path}`
    );
    next();
  } catch (error) {
    logger.warn(
      `[AuthMiddleware] 관리자 권한 확인 실패: ${req.method} ${req.path}`,
      { error: error instanceof Error ? error.message : error }
    );
    next(error);
  }
};
