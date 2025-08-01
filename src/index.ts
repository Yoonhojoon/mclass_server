import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';
import usersRouter from './routes/users.js';
import {
  prometheusMiddleware,
  metricsEndpoint,
} from './middleware/monitoring.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prometheus 메트릭 수집 미들웨어
app.use(prometheusMiddleware);

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 라우트 설정
app.use('/api/users', usersRouter);

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

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`http://localhost:${PORT}`);
  console.log(`API 문서: http://localhost:${PORT}/api-docs`);
  console.log(`메트릭: http://localhost:${PORT}/metrics`);
  console.log(`헬스체크: http://localhost:${PORT}/health`);
});
