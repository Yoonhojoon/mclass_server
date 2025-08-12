### 약관 동의(Consent) 흐름 개선 제안: AuthService ↔ TermService

#### 배경
- 현재 회원가입 완료 플로우는 `AuthService.completeSignUp`에서 다음 순서로 동작합니다.
  - `AuthRepository.validateTermIds(termIds)`로 약관 ID 유효성 검증
  - 각 `termId`에 대해 `TermService.agreeToTerm(userId, termId)` 호출 (병렬 처리)
  - 사용자 `isSignUpCompleted` 갱신 및 토큰 재발급

- 약관/동의 도메인의 코어 로직은 `TermService`에 있습니다.
  - `agreeToTerm`, `hasUserAgreed`, `hasUserAgreedToAllRequired` 등

참고 파일
- `src/domains/auth/auth.service.ts`
- `src/domains/auth/auth.repository.ts`
- `src/domains/term/term.service.ts`
- `src/domains/term/term.repository.ts`

#### 문제/개선 여지
1. 도메인 경계 혼재
   - `validateTermIds`가 `AuthRepository`에 있어 약관 도메인 지식이 인증 도메인에 위치함.
   - 응집도(DDD 관점) 측면에서 `TermService/TermRepository`로 위치 이전이 적절.

2. 트랜잭션 부재로 인한 일관성 이슈 가능성
   - 다건 동의 생성 + 사용자 `isSignUpCompleted` 갱신이 서로 다른 호출로 분리되어 있어 부분 성공 가능성 존재.

3. 배치(다건) API 부재
   - `AuthService`에서 `Promise.all`로 단건 API를 N회 호출. 도메인 내부에 배치 동의 API가 있으면 응집성과 가독성이 향상됨.

4. 성능/로깅
   - 다건 동의 시 N개의 쿼리 발생. 상황에 따라 배치 처리(`$transaction`, `createMany` 등) 고려 여지.

5. 검증 일관성
   - 필수 약관 동의 검증 위치/정책을 `TermService` 기준으로 일원화하면 재사용성과 테스트 용이성 증가.

#### 제안 사항
1) `validateTermIds`를 약관 도메인으로 이동
- `AuthRepository.validateTermIds` → `TermRepository.validateTermIds` (또는 `TermService.validateTermIds` 공개 메서드로 감싸서 노출)
- `AuthService.completeSignUp`에서는 `TermService`를 통해 검증 수행

2) 배치 동의 도입: `TermService.agreeToTerms(userId, termIds: string[])`
- 내부 단계
  - `validateTermIds(termIds)`로 유효성 확인 및 중복 제거
  - 이미 동의된 항목 필터링
  - 남은 항목들에 대해 `$transaction`으로 일괄 동의 생성
  - 반환: 생성된 `UserTermAgreement[]` (또는 필요한 최소 정보)

3) 트랜잭션 경계 정비
- 두 가지 옵션 중 택1
  - 옵션 A: `AuthService.completeSignUp`에서 다음을 하나의 `$transaction`으로 묶음
    - `TermService.agreeToTerms`
    - 사용자 `isSignUpCompleted = true` 업데이트
  - 옵션 B: 위 2개 단계를 `TermService`에 위임하여 도메인 내부 트랜잭션으로 처리하고, `AuthService`는 결과만 소비
- 토큰 발급은 DB 커밋 이후 수행 (커밋 실패 시 토큰 발급 방지)

4) 정책 정교화
- 이미 동의한 약관 ID가 포함된 경우의 동작 정의
  - 에러 반환 vs. 멱등 처리(무시) 중 선택
  - 현재는 `TermService.agreeToTerm`가 `alreadyAgreed` 에러를 던짐 → 배치에서도 동일 정책 유지 또는 멱등화 옵션 도입

#### 구현 가이드 (고수준)
- `src/domains/term/term.repository.ts`
  - `validateTermIds(termIds: string[]): Promise<string[]>` 추가
  - 필요 시 `createMany` 가능성 타진 (고유 제약조건, 감사 컬럼 등 고려)

- `src/domains/term/term.service.ts`
  - `validateTermIds` 위임 메서드 추가(선택)
  - `agreeToTerms(userId: string, termIds: string[]): Promise<UserTermAgreement[]>` 추가
    - 내부에서 `$transaction` 사용
    - 이미 동의된 항목 제외 또는 정책에 맞는 에러 매핑

- `src/domains/auth/auth.service.ts`
  - `completeSignUp`에서 `validateTermIds` 직접 호출 제거
  - `agreeToTerms` 호출로 치환
  - (옵션) `isSignUpCompleted` 업데이트까지 트랜잭션으로 동시 처리

예시 시그니처
```ts
// term.service.ts
async validateTermIds(termIds: string[]): Promise<string[]>

async agreeToTerms(
  userId: string,
  termIds: string[]
): Promise<UserTermAgreement[]> // 내부에서 $transaction
```

#### 테스트 전략
- 단위 테스트
  - `agreeToTerms` 정상/에러 케이스 (유효하지 않은 ID, 중복 ID, 이미 동의된 ID 포함 등)
  - 트랜잭션 롤백 확인 (중간 실패 시 아무 것도 커밋되지 않음)

- 통합 테스트
  - `AuthService.completeSignUp`가 유효한 `termIds`로 성공하고 `isSignUpCompleted`가 true로 변경되는지
  - 커밋 성공 후 토큰 발급 확인

#### 마이그레이션/호환성
- DB 스키마 변경 없음 → 마이그레이션 불필요
- 외부 API 스펙 변경 없음 → 클라이언트 영향 없음
- 내부 예외 정책을 멱등화로 바꿀 경우 에러 코드 일부 변화 가능 (명시적 릴리즈 노트 권장)

#### 리스크 및 완화
- 트랜잭션 범위 확대로 인해 잠금 경합 가능성 소폭 증가 → 짧은 트랜잭션 유지, 필요한 인덱스 확인
- 배치 처리 시 에러 핸들링 복잡도 증가 → 명확한 정책(멱등/에러)을 테스트로 보증

#### 예상 작업 순서(초안)
1) `validateTermIds`를 Term 도메인으로 이전하고 컴파일/테스트 통과
2) `agreeToTerms` 추가 및 단위 테스트 작성
3) `AuthService.completeSignUp` 리팩터링 (배치 동의 호출 + 트랜잭션)
4) 통합 테스트/스모크 테스트
5) 릴리즈 노트에 내부 정책 변경(있을 시) 명시

#### 기대 효과
- 도메인 경계 정렬로 코드 응집도 향상
- 트랜잭션 도입으로 데이터 일관성 강화
- 배치 API 제공으로 성능/가독성 개선 및 유지보수성 향상


