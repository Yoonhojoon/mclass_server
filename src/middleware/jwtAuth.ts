import type { RequestHandler } from 'express';
import { TokenService } from '../domains/token/token.service.js';
import type { AuthenticatedUser } from '../types/express.js';
import logger from '../config/logger.config.js';

export const jwtAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    logger.info('🔍 JWT 인증 미들웨어 시작', {
      method: req.method,
      path: req.path,
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPrefix: token ? token.substring(0, 20) + '...' : '없음',
    });

    if (!token) {
      logger.info(`[JwtAuth] 인증 토큰 없음: ${req.method} ${req.path}`);
      return next();
    }

    logger.info('🔍 토큰 검증 시작', {
      method: req.method,
      path: req.path,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
    });

    try {
      const decoded = await TokenService.verifyAccessTokenWithBlacklist(token);

      logger.info('✅ 토큰 검증 성공', {
        method: req.method,
        path: req.path,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        isAdmin: decoded.isAdmin,
        signUpCompleted: decoded.signUpCompleted,
        provider: decoded.provider,
      });

      const user: AuthenticatedUser = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        isAdmin: decoded.isAdmin,
        signUpCompleted: decoded.signUpCompleted,
        provider: decoded.provider,
      };

      req.user = user;
      logger.info(
        `[JwtAuth] 토큰 인증 성공: 사용자 ID ${decoded.userId}, 경로 ${req.method} ${req.path}`
      );
    } catch (tokenError) {
      logger.warn(`[JwtAuth] 토큰 검증 실패: ${req.method} ${req.path}`, {
        error: tokenError instanceof Error ? tokenError.message : tokenError,
        stack: tokenError instanceof Error ? tokenError.stack : undefined,
        errorType:
          tokenError instanceof Error ? tokenError.constructor.name : 'Unknown',
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
      });
      // 토큰이 잘못되어도 그냥 통과 → requireAuth에서 차단
    }
  } catch (error) {
    logger.error(`[JwtAuth] 미들웨어 오류: ${req.method} ${req.path}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
    });
  } finally {
    next();
  }
};
