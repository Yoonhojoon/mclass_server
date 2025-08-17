// ioredis를 ioredis-mock으로 모킹 (다른 import보다 먼저 실행)
jest.mock('ioredis', () => require('ioredis-mock'));

import { config } from 'dotenv';

// 테스트 환경에서 .env 파일 로드
config({ path: '.env', debug: false });

// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';

// 테스트용 이메일 설정 (더미 SMTP 서버)
process.env.EMAIL_HOST = 'localhost';
process.env.EMAIL_PORT = '1025';
process.env.EMAIL_USER = 'dummy';
process.env.EMAIL_PASS = 'dummy';
process.env.EMAIL_FROM = 'test@example.com';

// 테스트 환경에서 크론 작업 비활성화
process.env.DISABLE_CRON_JOBS = 'true';

// 글로벌 테스트 타임아웃 설정
jest.setTimeout(30000);

// 테스트 실행 전 로그 레벨 조정
process.env.LOG_LEVEL = 'error';

// 전역 Mock 설정
jest.mock('../config/logger.config.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// 테스트 실행 전 모든 Mock 초기화
beforeAll(() => {
  jest.clearAllMocks();
});

// 각 테스트 후 Mock 초기화
afterEach(() => {
  jest.clearAllMocks();
});
