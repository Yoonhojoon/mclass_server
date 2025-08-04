import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../domains/token/token.service.js';
import { AuthError } from '../common/exception/auth/AuthError.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
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
): Promise<Response | void> => {
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
    if (error instanceof AuthError) {
      return res.status(401).json({
        error: error.name,
        message: error.message,
      });
    }
    return res.status(401).json({
      error: 'AUTHENTICATION_FAILED',
      message: '인증에 실패했습니다.',
    });
  }
};

/**
 * 회원가입 완료 확인 미들웨어
 */
export const requireSignUpCompleted = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    if (!(req as AuthenticatedRequest).user) {
      throw AuthError.authenticationFailed('인증이 필요합니다.');
    }

    if (!(req as AuthenticatedRequest).user?.signUpCompleted) {
      return res.status(403).json({
        error: 'SIGNUP_NOT_COMPLETED',
        message: '약관 동의가 필요합니다.',
        code: 'TERMS_REQUIRED',
      });
    }

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({
        error: error.name,
        message: error.message,
      });
    }
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: '서버 오류가 발생했습니다.',
    });
  }
};

/**
 * 관리자 권한 확인 미들웨어
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    if (!(req as AuthenticatedRequest).user) {
      throw AuthError.authenticationFailed('인증이 필요합니다.');
    }

    if ((req as AuthenticatedRequest).user?.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: '관리자 권한이 필요합니다.',
      });
    }

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({
        error: error.name,
        message: error.message,
      });
    }
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: '서버 오류가 발생했습니다.',
    });
  }
};
