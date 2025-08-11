import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../domains/token/token.service.js';
import { AuthError } from '../common/exception/auth/AuthError.js';

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
      throw AuthError.authenticationFailed('인증 토큰이 필요합니다.');
    }

    const decoded = TokenService.verifyAccessToken(token);
    (req as AuthenticatedRequest).user = decoded;

    next();
  } catch (error) {
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
      throw AuthError.authenticationFailed('인증이 필요합니다.');
    }

    if (!(req as AuthenticatedRequest).user?.signUpCompleted) {
      throw AuthError.permissionDenied('서비스', '이용');
    }

    next();
  } catch (error) {
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
      throw AuthError.authenticationFailed('인증이 필요합니다.');
    }

    if (!(req as AuthenticatedRequest).user?.isAdmin) {
      throw AuthError.permissionDenied('관리자 기능', '접근');
    }

    next();
  } catch (error) {
    next(error);
  }
};
