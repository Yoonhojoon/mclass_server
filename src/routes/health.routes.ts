import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma.config.js';
import { redis } from '../config/redis.config.js';
import { jwtConfig } from '../config/jwt.config.js';
import logger from '../config/logger.config.js';

const router = Router();

// Liveness probe - 애플리케이션 생존 여부 확인
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
  });
});

// Readiness probe - 서비스 준비 상태 확인 (외부 의존성 체크)
router.get('/readyz', async (req: Request, res: Response) => {
  try {
    // 데이터베이스 연결 상태 확인
    await prisma.$queryRaw`SELECT 1`;

    // Redis 연결 상태 확인
    await redis.ping();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: 'disconnected',
        redis: 'disconnected',
      },
    });
  }
});

// 상세 헬스체크 (관리자용)
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // 데이터베이스 연결 테스트
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Redis 연결 테스트
    const redisStart = Date.now();
    await redis.ping();
    const redisLatency = Date.now() - redisStart;

    const totalLatency = Date.now() - startTime;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
        },
        redis: {
          status: 'connected',
          latency: `${redisLatency}ms`,
        },
      },
      totalLatency: `${totalLatency}ms`,
    });
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 디버그 정보 (개발/배포 환경 문제 해결용)
router.get('/debug', (req: Request, res: Response) => {
  try {
    res.status(200).json({
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
      },
      jwt: {
        secret: jwtConfig.secret ? '설정됨' : '설정되지 않음',
        secretLength: jwtConfig.secret?.length || 0,
        expiresIn: jwtConfig.expiresIn,
        refreshExpiresIn: jwtConfig.refreshExpiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      },
      redis: {
        status: redis.status,
        connected: redis.status === 'ready',
        options: {
          host: redis.options.host,
          port: redis.options.port,
          db: redis.options.db,
        },
      },
      environmentVariables: {
        JWT_SECRET: process.env.JWT_SECRET ? '설정됨' : '설정되지 않음',
        JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
        JWT_ISSUER: process.env.JWT_ISSUER || '기본값 사용',
        JWT_AUDIENCE: process.env.JWT_AUDIENCE || '기본값 사용',
        REDIS_URL: process.env.REDIS_URL ? '설정됨' : '설정되지 않음',
        REDIS_HOST: process.env.REDIS_HOST || '기본값 사용',
        REDIS_PORT: process.env.REDIS_PORT || '기본값 사용',
        REDIS_PASSWORD: process.env.REDIS_PASSWORD ? '설정됨' : '설정되지 않음',
      },
    });
  } catch (error) {
    logger.error('Debug endpoint failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
