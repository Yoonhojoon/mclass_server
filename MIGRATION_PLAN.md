# Zod Migration Plan

## 단계별 마이그레이션 계획

### Phase 1: 기반 구축 (완료)
- [x] 공통 스키마 생성 (`src/schemas/common/`)
- [x] Auth 도메인 스키마 생성 (`src/schemas/auth/`)
- [x] MClass 도메인 스키마 생성 (`src/schemas/mclass/`)
- [x] zod-to-openapi 설치
- [x] 샘플 라우트 마이그레이션 (Auth, MClass)

### Phase 2: 나머지 도메인 마이그레이션 (완료)
- [x] Term 도메인 스키마 생성 (`src/schemas/term/`)
- [x] User 도메인 스키마 생성 (`src/schemas/user/`)
- [x] EnrollmentForm 도메인 스키마 생성 (`src/schemas/enrollmentForm/`)
- [x] 각 도메인의 라우트 파일 업데이트

### Phase 3: 응답 스키마 및 변환 로직 (완료)
- [x] 주요 리소스 응답 스키마 생성
- [x] @Expose/@Transform 로직을 Zod transform()으로 대체
- [x] 서비스→컨트롤러 직렬화 로직 업데이트

### Phase 4: OpenAPI 통합 (완료)
- [x] zod-to-openapi 설정
- [x] 기존 swagger-jsdoc 정의를 Zod 기반으로 재생성
- [x] API 문서 자동 생성 테스트

### Phase 5: 정리 및 최적화 (완료)
- [x] 기존 DTO 파일 제거
- [x] validateDto 미들웨어 제거
- [x] class-validator/transformer 의존성 제거
- [x] tsconfig.json 정리 (experimentalDecorators, emitDecoratorMetadata)

## 현재 DTO/미들웨어 현황 (2024년 12월 기준)

### 남아있는 DTO 파일들
**EnrollmentForm 도메인**:
- `src/domains/enrollmentForm/dto/CreateEnrollmentFormDto.ts` - Zod 기반으로 마이그레이션 완료
- `src/domains/enrollmentForm/dto/UpdateEnrollmentFormDto.ts` - Zod 기반으로 마이그레이션 완료
- `src/domains/enrollmentForm/dto/EnrollmentFormResponse.ts` - TypeScript 인터페이스 (제거 예정)

**Auth 도메인**:
- `src/domains/auth/dto/OAuthProfile.ts` - TypeScript 인터페이스 (제거 예정)

**User 도메인**:
- `src/domains/user/dto/UserProfileResponse.ts` - TypeScript 인터페이스 (제거 예정)

### 제거된 항목들
- `validateDto.middleware.ts` - 완전히 제거됨
- class-validator 관련 의존성 - package.json에서 제거됨
- class-transformer 관련 의존성 - package.json에서 제거됨

### DTO 제거 예정 목록
다음 파일들은 TypeScript 인터페이스로만 구성되어 있으며, Zod 스키마로 대체하여 제거 예정입니다:

1. `src/domains/enrollmentForm/dto/EnrollmentFormResponse.ts`
2. `src/domains/auth/dto/OAuthProfile.ts`
3. `src/domains/user/dto/UserProfileResponse.ts`

**총 제거 예정 파일 수**: 3개

## 리스크 관리

### 고위험 항목
1. **런타임 동작 변경**
   - **리스크**: 검증 로직 변경으로 인한 API 동작 변화
   - **완화**: 철저한 테스트, 점진적 배포
   - **롤백**: 이전 DTO 파일 유지 (deprecated 상태)

2. **타입 안전성 손실**
   - **리스크**: Zod 스키마와 실제 타입 불일치
   - **완화**: `z.infer<typeof schema>` 사용 강제
   - **검증**: TypeScript 컴파일 에러 확인

### 중위험 항목
1. **성능 영향**
   - **리스크**: Zod 검증으로 인한 성능 저하
   - **완화**: 스키마 최적화, 캐싱 고려
   - **모니터링**: 응답 시간 측정

2. **팀 학습 곡선**
   - **리스크**: Zod 학습으로 인한 개발 속도 저하
   - **완화**: 문서화, 코드 리뷰, 페어 프로그래밍
   - **지원**: Zod 사용 가이드 작성

### 저위험 항목
1. **의존성 충돌**
   - **리스크**: 패키지 버전 충돌
   - **완화**: 점진적 제거, 호환성 테스트
   - **해결**: package.json 정리

## 테스트 전략

### 단위 테스트
```typescript
// 스키마 단위 테스트 예시
describe('loginSchema', () => {
  it('should validate valid login data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123'
    };
    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'password123'
    };
    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

### 통합 테스트
```typescript
// 라우트 통합 테스트 예시
describe('POST /auth/login', () => {
  it('should return 400 for invalid data', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'invalid', password: '123' });
    expect(response.status).toBe(400);
  });

  it('should return 200 for valid data', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(response.status).toBe(200);
  });
});
```

### E2E 테스트
- API 전체 플로우 테스트
- 실제 데이터베이스 연동 테스트
- 성능 테스트

## 롤백 전략

### 즉시 롤백 (긴급 상황)
1. 기존 DTO 파일 복원
2. validateDto 미들웨어 복원
3. 라우트 파일 원복

### 점진적 롤백
1. 문제가 있는 도메인만 이전 방식으로 복원
2. 다른 도메인은 Zod 유지
3. 문제 해결 후 재마이그레이션

### 롤백 체크리스트
- [ ] API 응답 형식 확인
- [ ] 검증 로직 동작 확인
- [ ] 타입 안전성 확인
- [ ] 성능 지표 확인
- [ ] 사용자 피드백 확인

## 성공 지표

### 기술적 지표
- [ ] 모든 API 엔드포인트 Zod 검증 적용
- [ ] TypeScript 컴파일 에러 0개
- [ ] 테스트 커버리지 90% 이상
- [ ] API 응답 시간 10% 이내 증가

### 개발자 경험 지표
- [ ] 코드 리뷰 시간 단축
- [ ] 버그 리포트 감소
- [ ] 개발자 만족도 향상
- [ ] 문서화 자동화 완료

### 비즈니스 지표
- [ ] API 안정성 향상
- [ ] 배포 실패율 감소
- [ ] 유지보수 비용 절감

## 일정 계획

### Week 1-2: Phase 1-2
- 기반 구축 및 도메인별 마이그레이션
- 테스트 작성 및 검증

### Week 3: Phase 3
- 응답 스키마 및 변환 로직
- 성능 테스트 및 최적화

### Week 4: Phase 4-5
- OpenAPI 통합
- 정리 및 최적화
- 문서화 완료

### Week 5: 안정화
- 버그 수정
- 성능 튜닝
- 팀 교육 및 문서화

## 결론

이 마이그레이션 계획은 점진적 접근을 통해 리스크를 최소화하면서 Zod의 이점을 최대한 활용하는 것을 목표로 합니다. 각 단계마다 철저한 테스트와 검증을 거쳐 안전하게 전환할 수 있도록 설계되었습니다.
