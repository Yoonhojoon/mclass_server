import type { RequestHandler } from 'express';
import { TokenService } from '../domains/token/token.service.js';
import type { AuthenticatedUser } from '../types/express.js';
import logger from '../config/logger.config.js';

export const jwtAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.debug(`[JwtAuth] 인증 토큰 없음: ${req.method} ${req.path}`);
      return next();
    }

    const decoded = await TokenService.verifyAccessTokenWithBlacklist(token);
    const user: AuthenticatedUser = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      isAdmin: decoded.isAdmin,
      signUpCompleted: decoded.signUpCompleted,
      provider: decoded.provider,
    };

    req.user = user;
    logger.debug(
      `[JwtAuth] 토큰 인증 성공: 사용자 ID ${decoded.userId}, 경로 ${req.method} ${req.path}`
    );
  } catch (error) {
    logger.debug(`[JwtAuth] 토큰 인증 실패: ${req.method} ${req.path}`, {
      error: error instanceof Error ? error.message : error,
    });
    // 토큰이 잘못되어도 그냥 통과 → requireAuth에서 차단
  } finally {
    next();
  }
};
