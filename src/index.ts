import 'dotenv/config';
import 'reflect-metadata';
import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { generateOpenApiDocument } from './config/openapi-generator.js';
import { createUserRoutes } from './routes/user.route.js';
import { createAuthOpenApiRoutes } from './routes/auth.openapi.routes.js';
import { createTermRoutes } from './routes/term.routes.js';
import { createAdminRoutes } from './routes/admin.routes.js';
import mclassRoutes from './routes/mclass.routes.js';
import { createEnrollmentRoutes } from './routes/enrollment.routes.js';
import { createEnrollmentFormRoutes } from './routes/enrollmentForm.routes.js';
import healthRoutes from './routes/health.routes.js';
import {
  prometheusMiddleware,
  metricsEndpoint,
} from './middleware/monitoring.js';
import { ErrorHandler } from './common/exception/ErrorHandler.js';
import { prisma } from './config/prisma.config.js';
import passport from './config/passport.config.js';
import logger from './config/logger.config.js';
import { redis, initializeRedis } from './config/redis.config.js';
import {
  authenticateToken as authenticate,
  requireAdmin as authorizeAdmin,
} from './middleware/auth.middleware.js';
import { corsMiddleware, corsPreflightMiddleware } from './middleware/cors.js';
import bcrypt from 'bcrypt';
import { ServiceContainer } from './services/email/index.js';
import { EmailOutboxWorker } from './services/email/email-outbox.worker.js';
import { EmailOutboxCron } from './cron/email-outbox.cron.js';
import { startTokenCleanupJob } from './cron/token-cleanup.cron.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy 설정 (ALB/NLB 뒤에서 실행 시 필수)
app.set('trust proxy', 1);

// Redis 스토어 설정
const redisStore = new RedisStore({
  client: redis,
  prefix: 'mclass:session:',
});

// CORS 미들웨어 적용 (모든 라우트보다 먼저)
app.use(corsMiddleware);

// OPTIONS 프리플라이트 처리 (Express 5.x 호환성을 위해 미들웨어로 처리)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightMiddleware(req, res, next);
  }
  next();
});

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

// 라우트 설정
app.use('/api/users', createUserRoutes(prisma));
app.use('/api/auth', createAuthOpenApiRoutes(prisma));
app.use('/api', createTermRoutes(prisma));
app.use('/api/admin', createAdminRoutes(prisma));
app.use('/api', mclassRoutes(prisma));
app.use('/api', createEnrollmentRoutes(prisma));
app.use('/api', createEnrollmentFormRoutes(prisma));

// 헬스체크 라우트
app.use('/', healthRoutes);

// OpenAPI 문서 생성 (모든 라우트 등록 후 생성해야 경로가 반영됩니다)
const openApiSpec = generateOpenApiDocument();

// Swagger UI 설정
app.use(
  '/api-docs',
  (req, res, next) => {
    // Swagger UI에 대한 CORS 헤더 설정
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      // CORS 관련 설정 추가
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        // Swagger UI에서 보내는 요청에 CORS 헤더 추가
        req.headers = req.headers || {};
        req.headers['Content-Type'] = 'application/json';
        return req;
      },
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MClass API Documentation',
  })
);

// Swagger JSON 스키마 엔드포인트
app.get('/api-docs.json', (req: Request, res: Response) => {
  // CORS 헤더 설정
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  res.setHeader('Content-Type', 'application/json');
  res.json(openApiSpec);
});

// Prometheus 메트릭 엔드포인트 (VPC 내부 보안에만 의존)
app.get('/metrics', metricsEndpoint);

// 기본 라우트
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'TypeScript Express 서버가 실행 중입니다!',
    metrics: '/metrics',
    docs: '/api-docs',
    health: '/health',
    ready: '/readyz',
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
        database: process.env.DB_NAME || 'mclass_db',
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
      // setTimeout을 안전하게 사용 (테스트 환경에서는 .unref() 적용)
      await new Promise(resolve => {
        const timer = globalThis.setTimeout(resolve, retryDelay);
        // 테스트 환경이 아닐 때만 .unref() 적용 (테스트에서는 타이머 추적 필요)
        if (process.env.NODE_ENV !== 'test' && timer.unref) {
          timer.unref();
        }
        return (): void => globalThis.clearTimeout(timer);
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

    // Redis 설정 확인
    if (process.env.REDIS_URL) {
      logger.info(`  - REDIS_URL: 설정됨`);
      logger.info('  - Redis 개별 설정: REDIS_URL 사용으로 무시됨');
    } else {
      logger.info(`  - REDIS_URL: not set (개별 설정 사용)`);
      logger.info(
        `  - REDIS_HOST: ${process.env.REDIS_HOST || 'localhost (default)'}`
      );
      logger.info(
        `  - REDIS_PORT: ${process.env.REDIS_PORT || '6379 (default)'}`
      );
      logger.info(
        `  - REDIS_PASSWORD: ${process.env.REDIS_PASSWORD ? '설정됨' : 'not set'}`
      );
      logger.info(`  - REDIS_DB: ${process.env.REDIS_DB || '0 (default)'}`);
    }
    logger.info(
      `  - INITIAL_ADMIN_EMAIL: ${process.env.INITIAL_ADMIN_EMAIL || 'not set'}`
    );
    logger.info(
      `  - INITIAL_ADMIN_PASSWORD: ${process.env.INITIAL_ADMIN_PASSWORD ? '설정됨' : 'not set'}`
    );
    logger.info(
      `  - INITIAL_ADMIN_NAME: ${process.env.INITIAL_ADMIN_NAME || 'not set'}`
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

    // Redis 연결 확인
    logger.info('🔴 Redis 연결 확인 중...');
    await initializeRedis();

    // 이메일 서비스 초기화
    logger.info('📧 이메일 서비스 초기화 중...');
    const emailService = ServiceContainer.getEmailService(logger);
    const emailOutboxWorker = new EmailOutboxWorker(emailService, logger);

    // 이메일 서버 연결 확인
    logger.info('📧 이메일 서버 연결 확인 중...');
    logger.info(`  - EMAIL_HOST: ${process.env.EMAIL_HOST || 'not set'}`);
    logger.info(`  - EMAIL_PORT: ${process.env.EMAIL_PORT || '587 (default)'}`);
    logger.info(
      `  - EMAIL_USER: ${process.env.EMAIL_USER ? '설정됨' : 'not set'}`
    );
    logger.info(
      `  - EMAIL_PASS: ${process.env.EMAIL_PASS ? '설정됨' : 'not set'}`
    );
    logger.info(`  - EMAIL_FROM: ${process.env.EMAIL_FROM || 'not set'}`);

    const emailConnectionOk = await emailService.verifyConnection();
    if (!emailConnectionOk) {
      logger.error('❌ 이메일 서버 연결 실패');
      logger.error('🔧 해결 방법:');
      logger.error('  1. Gmail 2단계 인증 활성화');
      logger.error('  2. 앱 비밀번호 생성');
      logger.error('  3. 환경 변수 확인');
      logger.error('  4. docs/email-setup.md 참조');
      logger.warn('⚠️ 이메일 알림 기능이 제한될 수 있습니다');
    } else {
      logger.info('✅ 이메일 서버 연결 확인 완료');
    }

    // 이메일 아웃박스 워커 시작 (테스트 환경에서는 비활성화)
    if (process.env.DISABLE_CRON_JOBS !== 'true') {
      logger.info('📧 이메일 아웃박스 워커 시작 중...');
      const emailCron = new EmailOutboxCron(emailOutboxWorker, logger);
      emailCron.start();
    } else {
      logger.info(
        '📧 이메일 아웃박스 워커가 테스트 환경에서 비활성화되었습니다.'
      );
    }

    // 토큰 정리 크론 작업 시작 (테스트 환경에서는 비활성화)
    if (process.env.DISABLE_CRON_JOBS !== 'true') {
      logger.info('🧹 토큰 정리 크론 작업 시작 중...');
      startTokenCleanupJob();
    } else {
      logger.info(
        '🧹 토큰 정리 크론 작업이 테스트 환경에서 비활성화되었습니다.'
      );
    }

    logger.info('🌐 HTTP 서버 시작 중...');
    app.listen(PORT, (): void => {
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
process.on('SIGINT', async () => {
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
