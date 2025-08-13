import request from 'supertest';
import express from 'express';
import { prisma } from '../config/prisma.config.js';
import { createUserRoutes } from '../routes/user.route.js';
import { createAuthRoutes } from '../routes/auth.routes.js';
import { createTermRoutes } from '../routes/term.routes.js';
import { createAdminRoutes } from '../routes/admin.routes.js';

// Express 앱을 테스트용으로 생성
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // 라우트 설정
  app.use('/api/users', createUserRoutes(prisma));
  app.use('/api/auth', createAuthRoutes(prisma));
  app.use('/api', createTermRoutes(prisma));
  app.use('/api/admin', createAdminRoutes(prisma));

  app.get('/', (req, res) => {
    res.json({ message: 'TypeScript Express 서버가 실행 중입니다!' });
  });

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  return app;
};

describe('Express Server Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body).toEqual({
        message: 'TypeScript Express 서버가 실행 중입니다!',
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toEqual({
        status: 'OK',
      });
    });
  });
});
