import { config } from 'dotenv';

// 테스트 환경에서 .env 파일 로드 (로그 억제)
config({ path: '.env.test', debug: false });

// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:mclass@localhost:5432/mclass_test_db';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// 테스트용 이메일 설정 (더미 SMTP 서버)
process.env.EMAIL_HOST = 'localhost';
process.env.EMAIL_PORT = '1025';
process.env.EMAIL_USER = 'dummy';
process.env.EMAIL_PASS = 'dummy';
process.env.EMAIL_FROM = 'test@example.com';

// 글로벌 테스트 타임아웃 설정
jest.setTimeout(30000);

// 테스트 실행 전 로그 레벨 조정
process.env.LOG_LEVEL = 'error';

// 테스트 환경에서 console.log 억제
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Jest가 이 파일을 테스트로 인식하지 않도록 설정
if (typeof jest !== 'undefined') {
  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
}
