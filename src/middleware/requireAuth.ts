import type { RequestHandler } from 'express';
import { AuthError } from '../common/exception/auth/AuthError.js';
import logger from '../config/logger.config.js';

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.user) {
    logger.warn(
      `[RequireAuth] 인증되지 않은 사용자 접근 시도: ${req.method} ${req.path}`
    );
    const authError = AuthError.authenticationFailed('로그인이 필요합니다.');
    return res.status(authError.statusCode).json(authError.toResponse());
  }

  logger.debug(
    `[RequireAuth] 인증 확인 성공: 사용자 ID ${req.user.userId}, 경로 ${req.method} ${req.path}`
  );
  next();
};
