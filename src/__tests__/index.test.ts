import request from 'supertest';
import express from 'express';

// Express 앱을 테스트용으로 생성
const createTestApp = () => {
  const app = express();
  app.use(express.json());

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
