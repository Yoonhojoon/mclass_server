# Artillery 부하 테스트 가이드

## 개요
이 디렉토리는 200명 이상의 동시 신청 상황을 시뮬레이션하기 위한 Artillery 부하 테스트 설정 파일들을 포함합니다.

## 설치 및 설정

### 1. Artillery 설치
```bash
npm install -g artillery
```

### 2. 테스트 환경 준비
```bash
# 테스트용 데이터베이스 마이그레이션
npm run db:migrate:test

# 테스트용 시드 데이터 생성
npm run db:seed:test

# 서버 시작 (테스트 모드)
npm run start:test
```

## 테스트 시나리오

### 1. 동시 신청 부하 테스트
```bash
# 기본 부하 테스트 실행
artillery run load-test.yml

# 결과를 JSON 파일로 저장
artillery run --output results/load-test-results.json load-test.yml

# HTML 리포트 생성
artillery report results/load-test-results.json
```

**테스트 내용:**
- 60초 워밍업 (초당 5명)
- 30초 피크 부하 (초당 200명)
- 60초 지속 부하 (초당 50명)

### 2. 멱등성 테스트
```bash
artillery run idempotency-test.yml
```

**테스트 내용:**
- 동일한 idempotencyKey로 3번 연속 요청
- 중복 신청 방지 검증
- 응답 일관성 확인

### 3. 대기열 승격 테스트
```bash
artillery run waitlist-promotion-test.yml
```

**테스트 내용:**
- 승인된 신청 취소
- 대기열 자동 승격
- FIFO 순서 검증

### 4. 장시간 부하 테스트
```bash
artillery run endurance-test.yml
```

**테스트 내용:**
- 1시간 지속 부하
- 메모리 누수 검증
- 시스템 안정성 확인

### 5. 스파이크 테스트
```bash
artillery run spike-test.yml
```

**테스트 내용:**
- 갑작스러운 트래픽 증가
- 오토스케일링 동작 확인
- 복구 능력 검증

## 모니터링

### 실시간 모니터링
```bash
# CloudWatch 메트릭 확인
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=mclass-service \
  --start-time $(date -d '1 hour ago' --iso-8601=seconds) \
  --end-time $(date --iso-8601=seconds) \
  --period 300 \
  --statistics Average

# 로그 스트림 확인
aws logs tail /ecs/mclass-task --follow
```

### 성능 지표
- **응답 시간**: 평균 2초 이하
- **오류율**: 5% 이하
- **처리량**: 초당 100 요청 이상
- **동시성**: 200명 동시 신청 처리

## 결과 분석

### 성공 기준
1. **데이터 정합성**: 100% 정확한 정원 관리
2. **응답 시간**: 평균 2초 이하
3. **오류율**: 5% 이하
4. **처리량**: 초당 100 요청 이상
5. **동시성**: 200명 동시 신청 처리 가능

### 실패 시나리오
1. **오버부킹**: 정원을 초과하여 승인
2. **데이터 손실**: 신청 데이터 누락
3. **시스템 다운**: 서비스 중단
4. **응답 지연**: 10초 이상 응답 지연

## 문제 해결

### 일반적인 문제들

#### 1. 연결 타임아웃
```bash
# 타임아웃 설정 증가
artillery run --config config.json load-test.yml
```

```json
{
  "http": {
    "timeout": 60
  }
}
```

#### 2. 메모리 부족
```bash
# Node.js 메모리 제한 증가
NODE_OPTIONS="--max-old-space-size=2048" artillery run load-test.yml
```

#### 3. 데이터베이스 연결 풀 고갈
```bash
# Prisma 연결 풀 설정 확인
# prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 20
}
```

### 디버깅

#### 1. 상세 로그 활성화
```bash
DEBUG=* artillery run load-test.yml
```

#### 2. 특정 요청만 테스트
```bash
# 단일 요청 테스트
artillery run --config single-request.yml
```

#### 3. 성능 프로파일링
```bash
# Node.js 프로파일링
node --prof app.js
node --prof-process isolate-*.log > profile.txt
```

## 최적화 팁

### 1. 테스트 데이터 준비
```javascript
// 테스트용 사용자 생성
const testUsers = Array.from({ length: 1000 }, (_, i) => ({
  email: `test${i}@example.com`,
  password: 'password123',
  name: `Test User ${i}`
}));
```

### 2. 병렬 테스트 실행
```bash
# 여러 테스트 동시 실행
artillery run load-test.yml &
artillery run idempotency-test.yml &
wait
```

### 3. 결과 비교
```bash
# 이전 결과와 비교
artillery compare results/before.json results/after.json
```

## CI/CD 통합

### GitHub Actions
```yaml
name: Load Test
on: [push]
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g artillery
      - run: artillery run load-test.yml
```

### 성공/실패 기준
- **성공**: 오류율 < 5%, 평균 응답 시간 < 2초
- **실패**: 오류율 >= 5% 또는 평균 응답 시간 >= 2초

## 참고 자료

- [Artillery 공식 문서](https://www.artillery.io/docs)
- [부하 테스트 모범 사례](https://www.artillery.io/docs/guides/best-practices)
- [성능 테스트 전략](https://www.artillery.io/docs/guides/performance-testing)

