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
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
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
    // 관리자 계정 수 확인
    const adminCount = await prisma.user.count({
      where: { isAdmin: true },
    });

    // 관리자가 없으면 초기 관리자 생성
    if (adminCount === 0) {
      const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
      const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;
      const initialAdminName = process.env.INITIAL_ADMIN_NAME || '시스템관리자';

      if (!initialAdminEmail || !initialAdminPassword) {
        logger.warn('⚠️ 초기 관리자 환경변수가 설정되지 않았습니다.');
        return;
      }

      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(initialAdminPassword, 10);

      // 초기 관리자 생성
      const admin = await prisma.user.create({
        data: {
          email: initialAdminEmail,
          password: hashedPassword,
          name: initialAdminName,
          role: 'ADMIN',
          isAdmin: true,
          isSignUpCompleted: true,
          provider: 'LOCAL',
        },
      });

      logger.info('✅ 초기 관리자 계정 생성 완료', {
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });
    } else {
      logger.info('ℹ️ 관리자 계정이 이미 존재합니다.');
    }
  } catch (error) {
    logger.error('❌ 초기 관리자 생성 중 오류:', error);
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

    logger.info('✅ 필수 환경변수 확인 완료');

    // Prisma 클라이언트 연결 테스트
    logger.info('🔌 데이터베이스 연결 중...');
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

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
if (process.argv[1] && process.argv[1].endsWith('index.ts')) {
  startServer();
}
