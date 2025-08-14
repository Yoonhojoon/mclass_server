import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma.config.js';
import { redis } from '../config/redis.config.js';
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

export default router;
