import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import usersRouter from './routes/users';

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 라우트 설정
app.use('/api/users', usersRouter);

// 기본 라우트
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'TypeScript Express 서버가 실행 중입니다!' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`http://localhost:${PORT}`);
  console.log(`API 문서: http://localhost:${PORT}/api-docs`);
});
