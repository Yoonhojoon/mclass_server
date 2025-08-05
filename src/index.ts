import 'dotenv/config';
import express, { Request, Response } from 'express';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import usersRouter from './routes/users';
import authRouter from './routes/auth.routes';
import termRouter from './routes/term.routes';
import { prometheusMiddleware, metricsEndpoint } from './middleware/monitoring';
import { ErrorHandler } from './common/exception/ErrorHandler';
import { prisma } from './config/prisma.config';
import passport from './config/passport.config';
import logger from './config/logger.config';
import {
  authenticateToken as authenticate,
  requireAdmin as authorizeAdmin,
} from './middleware/auth.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
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
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api', termRouter);

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
        tableCount: (tableCount as any)[0].count,
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
const startServer = async (): Promise<void> => {
  try {
    // Prisma 클라이언트 연결 테스트
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  } catch (error) {
    logger.error('서버 시작 실패:', error);
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
