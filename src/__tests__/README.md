# 테스트 가이드

이 프로젝트는 Jest와 Supertest를 사용하여 다양한 레벨의 테스트를 구현합니다.

## 테스트 구조

```
src/__tests__/
├── setup.ts                    # 테스트 환경 설정
├── auth/
│   ├── auth.service.test.ts    # AuthService 단위 테스트
│   ├── auth.controller.test.ts # AuthController 단위 테스트
│   ├── auth.integration.test.ts # API 통합 테스트
│   └── auth.e2e.test.ts       # E2E 테스트
└── README.md                   # 이 파일
```

## 테스트 유형

### 1. 단위 테스트 (Unit Tests)
- **위치**: `auth.service.test.ts`, `auth.controller.test.ts`
- **목적**: 개별 함수나 메서드의 로직을 독립적으로 테스트
- **특징**: 
  - Mock을 사용하여 의존성을 격리
  - 빠른 실행 속도
  - 세밀한 테스트 케이스

### 2. 통합 테스트 (Integration Tests)
- **위치**: `auth.integration.test.ts`
- **목적**: API 엔드포인트의 전체 흐름을 테스트
- **특징**:
  - 실제 HTTP 요청 사용
  - Express 앱과 라우터 테스트
  - 미들웨어 동작 검증

### 3. E2E 테스트 (End-to-End Tests)
- **위치**: `auth.e2e.test.ts`
- **목적**: 전체 애플리케이션의 실제 동작을 테스트
- **특징**:
  - 실제 데이터베이스 사용
  - 전체 시스템 통합 테스트
  - 실제 비즈니스 시나리오 검증

## 테스트 실행

### 모든 테스트 실행
```bash
npm test
```

### 특정 테스트 파일 실행
```bash
npm test auth.service.test.ts
```

### 테스트 커버리지 확인
```bash
npm run test:coverage
```

### 테스트 감시 모드
```bash
npm run test:watch
```

## 테스트 환경 설정

### 환경 변수
테스트 실행 시 다음 환경 변수가 자동으로 설정됩니다:
- `NODE_ENV=test`
- `DATABASE_URL`: 테스트 데이터베이스 URL
- `JWT_SECRET`: 테스트용 JWT 시크릿
- `LOG_LEVEL=error`: 로그 레벨 최소화

### 데이터베이스 설정
E2E 테스트를 위해서는 별도의 테스트 데이터베이스가 필요합니다:
```bash
# 테스트 데이터베이스 생성
createdb mclass_test

# 테스트용 스키마 마이그레이션
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

## 테스트 작성 가이드

### 1. 테스트 구조
```typescript
describe('기능명', () => {
  beforeEach(() => {
    // 테스트 전 설정
  });

  afterEach(() => {
    // 테스트 후 정리
  });

  it('✅ 성공 케이스 설명', async () => {
    // Arrange: 테스트 데이터 준비
    // Act: 테스트 실행
    // Assert: 결과 검증
  });

  it('❌ 실패 케이스 설명', async () => {
    // 실패 케이스 테스트
  });
});
```

### 2. Mock 사용법
```typescript
// 의존성 Mock
jest.mock('../../domains/user/user.service.js');

// Mock 구현
const mockUserService = {
  authenticateUser: jest.fn(),
  createUser: jest.fn(),
} as any;

// Mock 반환값 설정
mockUserService.authenticateUser.mockResolvedValue(mockUser);
```

### 3. HTTP 요청 테스트
```typescript
// GET 요청
const response = await request(app)
  .get('/api/auth/profile')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);

// POST 요청
const response = await request(app)
  .post('/api/auth/login')
  .send(loginData)
  .expect(200);
```

## 테스트 커버리지

현재 테스트 커버리지 목표:
- **Statements**: 80% 이상
- **Branches**: 80% 이상
- **Functions**: 80% 이상
- **Lines**: 80% 이상

## 테스트 데이터 관리

### Fixture 사용
```typescript
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  isSignUpCompleted: true,
};
```

### 데이터베이스 정리
```typescript
beforeEach(async () => {
  await prisma.user.deleteMany();
  await prisma.term.deleteMany();
});
```

## 문제 해결

### 일반적인 문제들

1. **테스트 타임아웃**
   - `jest.setTimeout(10000)` 설정 확인
   - 비동기 작업 완료 대기 확인

2. **Mock이 작동하지 않음**
   - Mock 설정 위치 확인
   - `jest.clearAllMocks()` 사용

3. **데이터베이스 연결 실패**
   - 테스트 데이터베이스 존재 확인
   - 환경 변수 설정 확인

4. **JWT 토큰 문제**
   - 테스트용 JWT 시크릿 확인
   - 토큰 만료 시간 설정 확인

## 모범 사례

1. **테스트 격리**: 각 테스트는 독립적으로 실행될 수 있어야 함
2. **명확한 네이밍**: 테스트 설명이 명확해야 함
3. **AAA 패턴**: Arrange, Act, Assert 구조 사용
4. **실제 시나리오**: 실제 사용 사례를 반영한 테스트 작성
5. **에러 케이스**: 성공 케이스뿐만 아니라 실패 케이스도 테스트

## 추가 리소스

- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [Supertest 공식 문서](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices) 