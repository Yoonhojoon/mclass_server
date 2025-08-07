import 'dotenv/config';
import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { specs } from './config/swagger.js';
import { createUserRoutes } from './routes/users.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createTermRoutes } from './routes/term.routes.js';
import { createAdminRoutes } from './routes/admin.routes.js';
import {
  prometheusMiddleware,
  metricsEndpoint,
} from './middleware/monitoring.js';
import { ErrorHandler } from './common/exception/ErrorHandler.js';
import { prisma } from './config/prisma.config.js';
import passport from './config/passport.config.js';
import logger from './config/logger.config.js';
import { redis } from './config/redis.config.js';
import {
  authenticateToken as authenticate,
  requireAdmin as authorizeAdmin,
} from './middleware/auth.middleware.js';
import bcrypt from 'bcrypt';

const app = express();
const PORT = process.env.PORT || 3000;

// Redis 스토어 설정
const redisStore = new RedisStore({
  client: redis,
  prefix: 'mclass:session:',
});

// 미들웨어 설정
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://mclass-alb-616483239.ap-northeast-2.elb.amazonaws.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정 (Redis 스토어 사용)
app.use(
  session({
    store: redisStore,
    secret: process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24시간
    },
  })
);

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// Prometheus 메트릭 수집 미들웨어
app.use(prometheusMiddleware);

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 라우트 설정
app.use('/api/users', createUserRoutes(prisma));
app.use('/api/auth', createAuthRoutes(prisma));
app.use('/api', createTermRoutes(prisma));
app.use('/api/admin', createAdminRoutes(prisma));

// Prometheus 메트릭 엔드포인트
app.get('/metrics', metricsEndpoint);

// 기본 라우트
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'TypeScript Express 서버가 실행 중입니다!',
    metrics: '/metrics',
    docs: '/api-docs',
  });
});

// 헬스체크 엔드포인트
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 데이터베이스 연결 상태 확인 엔드포인트
app.get(
  '/db-status',
  authenticate,
  authorizeAdmin,
  async (req: Request, res: Response) => {
    try {
      // 데이터베이스 연결 테스트
      await prisma.$queryRaw`SELECT 1`;

      // Only include table count, not names
      const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

      res.json({
        status: 'connected',
        database: process.env.DATABASE_NAME || 'mclass_db',
        tableCount: (tableCount as Array<{ count: string }>)[0].count,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// 404 에러 핸들러
app.use(ErrorHandler.notFound);

// 전역 에러 핸들러 (반드시 마지막에 위치해야 함)
app.use(ErrorHandler.handle);

// 서버 시작
/**
 * 초기 관리자 계정 생성
 */
async function createInitialAdmin(): Promise<void> {
  try {
    // 데이터베이스 연결 상태 확인
    await prisma.$connect();

    // 관리자 계정이 이미 존재하는지 확인
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN',
      },
    });

    if (adminCount === 0) {
      // 초기 관리자 계정 생성
      const hashedPassword = await bcrypt.hash(
        process.env.INITIAL_ADMIN_PASSWORD || 'admin123',
        10
      );

      const admin = await prisma.user.create({
        data: {
          email: process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com',
          password: hashedPassword,
          name: process.env.INITIAL_ADMIN_NAME || 'admin',
          role: 'ADMIN',
          isAdmin: true,
          isSignUpCompleted: true,
          provider: 'LOCAL',
        },
      });

      logger.info('✅ 초기 관리자 계정이 생성되었습니다:', {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });
    } else {
      logger.info('ℹ️ 관리자 계정이 이미 존재합니다.');
    }
  } catch (error) {
    logger.error('❌ 초기 관리자 생성 중 오류:', error);
    throw error; // 오류를 다시 던져서 서버 시작을 중단
  }
}

// 데이터베이스 연결을 안전하게 처리하는 함수
async function ensureDatabaseConnection(): Promise<void> {
  const maxRetries = 5;
  const retryDelay = 2000; // 2초

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`🔌 데이터베이스 연결 시도 ${attempt}/${maxRetries}...`);
      await prisma.$connect();
      logger.info('✅ Database connected successfully');
      return;
    } catch (error) {
      logger.warn(
        `⚠️ 데이터베이스 연결 실패 (시도 ${attempt}/${maxRetries}):`,
        error
      );

      if (attempt === maxRetries) {
        logger.error('❌ 최대 재시도 횟수에 도달했습니다. 서버를 종료합니다.');
        throw error;
      }

      logger.info(`${retryDelay / 1000}초 후 재시도합니다...`);
      // setTimeout을 안전하게 사용
      await new Promise(resolve => {
        const timer = globalThis.setTimeout(resolve, retryDelay);
        return () => globalThis.clearTimeout(timer);
      });
    }
  }
}

const startServer = async (): Promise<void> => {
  try {
    logger.info('🚀 애플리케이션 시작 중...');
    logger.info('📋 환경변수 확인 중...');

    // 필수 환경변수 확인
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );

    if (missingVars.length > 0) {
      logger.error('❌ 필수 환경변수가 누락되었습니다:', missingVars);
      process.exit(1);
    }

    // 환경변수 값들 로그 출력 (민감한 정보는 마스킹)
    logger.info('📋 환경변수 설정 상태:');
    logger.info(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    logger.info(`  - PORT: ${process.env.PORT || '3000 (default)'}`);
    logger.info(
      `  - DATABASE_URL: ${process.env.DATABASE_URL ? '설정됨' : 'not set'}`
    );
    if (process.env.DATABASE_URL) {
      logger.info(`    📍 DATABASE_URL 값: ${process.env.DATABASE_URL}`);
    }
    logger.info(
      `  - JWT_SECRET: ${process.env.JWT_SECRET ? '설정됨' : 'not set'}`
    );
    logger.info(`  - REDIS_URL: ${process.env.REDIS_URL || 'not set'}`);
    logger.info(
      `  - INITIAL_ADMIN_EMAIL: ${process.env.INITIAL_ADMIN_EMAIL || 'not set'}`
    );
    logger.info(
      `  - INITIAL_ADMIN_PASSWORD: ${process.env.INITIAL_ADMIN_PASSWORD ? '설정됨' : 'not set'}`
    );
    logger.info(
      `  - INITIAL_ADMIN_NAME: ${process.env.INITIAL_ADMIN_NAME || 'not set'}`
    );

    logger.info('✅ 필수 환경변수 확인 완료');

    // 데이터베이스 연결 (재시도 로직 포함)
    await ensureDatabaseConnection();

    // 초기 관리자 계정 생성
    logger.info('👑 초기 관리자 계정 확인 중...');
    await createInitialAdmin();

    logger.info('🌐 HTTP 서버 시작 중...');
    app.listen(PORT, () => {
      logger.info(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
      logger.info(`http://localhost:${PORT}`);
      logger.info(`API 문서: http://localhost:${PORT}/api-docs`);
      logger.info(`메트릭: http://localhost:${PORT}/metrics`);
      logger.info(`헬스체크: http://localhost:${PORT}/health`);
      logger.info(`DB 상태: http://localhost:${PORT}/db-status`);
    });
  } catch (error) {
    logger.error('❌ 서버 시작 실패:', error);
    logger.error('🔍 오류 상세 정보:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async (): Promise<void> => {
  logger.info('서버를 종료합니다...');
  await prisma.$disconnect();
  process.exit(0);
});

// Export app for testing
export { app };

// Only start server if this file is run directly
if (
  process.argv[1] &&
  (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'))
) {
  startServer();
}
