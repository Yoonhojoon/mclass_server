# Validation Audit Report

## 1. 현황 분석

### Zod 사용 현황
- **파일 수**: 6개 파일
- **주요 위치**:
  - `src/middleware/validate.middleware.ts` (validateBody, validateQuery, validateParams)
  - `src/domains/enrollmentForm/dto/CreateEnrollmentFormDto.ts`
  - `src/domains/user/user.schemas.ts`
  - `src/domains/auth/auth.schemas.ts`
  - `src/domains/term/term.schemas.ts`
  - `src/domains/mclass/dto/UpdateMClassDto.ts`

### class-validator/transformer 사용 현황
- **파일 수**: 9개 파일
- **주요 위치**:
  - `src/middleware/validateDto.middleware.ts`
  - `src/domains/auth/dto/LoginDto.ts`, `RegisterDto.ts`
  - `src/domains/mclass/dto/CreateMClassDto.ts`
  - `src/domains/term/dto/` (5개 파일)

### 중복/충돌 사례
1. **POST /auth/login**: `validateDto(LoginDto)` vs `loginSchema`
2. **POST /auth/register**: `validateDto(RegisterDto)` vs `registerSchema`
3. **POST /mclass**: `validateDto(CreateMClassDto)` vs `UpdateMClassDtoSchema`

### OpenAPI 현황
- **방식**: swagger-jsdoc 수동 정의
- **Zod 연계**: 없음
- **위치**: `src/config/swagger.ts` (1495줄의 수동 스키마 정의)

## 2. 의사결정: Zod 표준화

### 선택 근거
1. **타입 안전성**: `z.infer<typeof schema>`로 컴파일 타임 타입 보장
2. **함수형 합성**: `.pipe()`, `.merge()`, `.pick()` 등으로 스키마 조합 용이
3. **런타임 검증**: 컴파일 타임과 런타임 모두에서 검증 보장
4. **의존성 단순화**: class-validator, class-transformer, reflect-metadata 제거 가능
5. **Express 생태계 적합성**: 미들웨어 패턴과 잘 맞음

### 반례 고려
- **@Expose/@Transform 사용량**: 8개 파일에서 사용 중
- **해결책**: Zod의 `.transform()` 또는 명시적 매핑 함수로 대체

## 3. 변경 범위

### 새로 생성된 파일
- `src/schemas/common/pagination.schema.ts`
- `src/schemas/auth/login.schema.ts`, `register.schema.ts`
- `src/schemas/mclass/create.schema.ts`, `update.schema.ts`, `query.schema.ts`

### 수정된 파일
- `src/routes/auth.routes.ts`: validateDto → validateBody
- `src/routes/mclass.routes.ts`: validateDto → validateBody/validateParams
- `src/domains/auth/dto/LoginDto.ts`, `RegisterDto.ts`: deprecated 처리

### 제거 예정 파일
- `src/middleware/validateDto.middleware.ts`
- 모든 class-validator 기반 DTO 파일들

## 4. 성능 및 유지보수성 개선

### 의존성 감소
- class-validator: 제거
- class-transformer: 제거
- reflect-metadata: 제거 (다른 곳에서 사용하지 않을 경우)

### 코드 복잡성 감소
- 데코레이터 기반 검증 → 함수형 스키마 검증
- 중복 검증 로직 제거
- 타입 추론 자동화

### OpenAPI 통합
- 수동 스키마 정의 → Zod 기반 자동 생성
- 스키마 동기화 문제 해결
- 문서화 자동화

## 5. 리스크 및 완화 방안

### 리스크
1. **기존 코드 호환성**: 점진적 마이그레이션으로 완화
2. **학습 곡선**: 팀원들의 Zod 학습 필요
3. **변환 로직 복잡성**: 명시적 매핑 함수로 해결

### 완화 방안
1. **점진적 마이그레이션**: 라우트 단위로 순차적 이관
2. **문서화**: Zod 사용 가이드 작성
3. **테스트 강화**: 스키마 단위 테스트 추가

## 6. 결론

Zod로의 표준화는 다음과 같은 이점을 제공합니다:
- **개발 생산성 향상**: 타입 안전성과 자동 완성
- **코드 품질 개선**: 중복 제거 및 일관성 확보
- **유지보수성 향상**: 단일 검증 체계로 복잡성 감소
- **문서화 자동화**: OpenAPI 스키마 자동 생성

점진적 마이그레이션을 통해 안전하게 전환할 수 있으며, 장기적으로는 코드베이스의 품질과 개발자 경험이 크게 향상될 것으로 예상됩니다.
