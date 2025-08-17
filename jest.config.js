export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleDirectories: ['node_modules', 'src'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/config/**/*.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // 메모리 누수 방지 설정 (필요시 활성화)
  // detectOpenHandles: true,
  // 테스트 후 정리
  globalTeardown: '<rootDir>/src/__tests__/teardown.ts',
  // 테스트 환경 변수 설정
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  // 테스트용 Prisma 스키마 사용
  testEnvironmentOptions: {
    DATABASE_URL: 'file:./test.db',
    TEST_DATABASE_URL: 'file:./test.db',
  },
}; 