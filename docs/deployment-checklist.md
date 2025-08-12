# 배포 전 점검 체크리스트

## 📋 현재 구성 인벤토리

| 항목 | 상태 | 위치/설정 |
|------|------|-----------|
| **Express 초기화 순서** | ✅ 적절함 | `src/index.ts` - cors() → express.json() → 라우터 → 에러 핸들러 |
| **CORS 설정** | ✅ 개선됨 | `src/middleware/cors.ts` - 환경별 origin, ALLOWED_ORIGINS 병합 |
| **Swagger 설정** | ✅ 개선됨 | `src/config/swagger-zod.ts` - 환경별 서버 URL, JSON 엔드포인트 추가 |
| **Trust Proxy** | ✅ 추가됨 | `src/index.ts` - `app.set('trust proxy', 1)` |
| **헬스체크** | ✅ 개선됨 | `/healthz` (liveness), `/readyz` (readiness), `/health/detailed` |
| **Docker 환경변수** | ✅ 개선됨 | TZ=Asia/Seoul 추가, 환경변수 샘플 파일 생성 |
| **배포 대상** | ✅ 설정됨 | ECS/Fargate, ALB, 포트 3000 |

## 🔧 수정된 항목

### 1. CORS 미들웨어 표준화
- **파일**: `src/middleware/cors.ts` (신규)
- **변경사항**:
  - 환경별 기본 origin 설정
  - ALLOWED_ORIGINS 환경변수 병합 로직
  - X-Forwarded-* 헤더 허용
  - preflightContinue: false, optionsSuccessStatus: 204 설정

### 2. Swagger 설정 개선
- **파일**: `src/config/swagger-zod.ts`
- **변경사항**:
  - NODE_ENV별 서버 URL 동적 설정
  - LOCAL_URL, STAGING_URL, PROD_URL 환경변수 지원
  - JSON 스키마 엔드포인트 `/api-docs.json` 추가

### 3. 헬스체크 엔드포인트 추가
- **파일**: `src/routes/health.routes.ts` (신규)
- **변경사항**:
  - `/healthz` - liveness probe
  - `/readyz` - readiness probe (DB, Redis 연결 체크)
  - `/health/detailed` - 상세 헬스체크 (관리자용)

### 4. Trust Proxy 설정
- **파일**: `src/index.ts`
- **변경사항**:
  - `app.set('trust proxy', 1)` 추가
  - ALB/NLB 뒤에서 X-Forwarded-* 헤더 처리 가능

### 5. Docker 환경변수 개선
- **파일**: `Dockerfile`
- **변경사항**:
  - `ENV TZ=Asia/Seoul` 추가

### 6. 환경변수 샘플 파일
- **파일**: `env.example` (신규)
- **변경사항**:
  - ALLOWED_ORIGINS, LOCAL_URL, STAGING_URL, PROD_URL 등 추가

## 🚨 리스크 해결 상태

### ✅ 해결된 리스크
- [x] CORS 미들웨어가 라우터 이전에 적용됨
- [x] OPTIONS 프리플라이트 처리 추가
- [x] Trust proxy 설정으로 ALB 뒤에서 정상 동작
- [x] Swagger JSON 스키마 엔드포인트 추가
- [x] 표준 헬스체크 엔드포인트 추가 (`/healthz`, `/readyz`)
- [x] 환경별 서버 URL 동적 설정

### ⚠️ 추가 확인 필요
- [ ] ALB 헬스체크 경로를 `/healthz`로 변경
- [ ] 스테이징 환경 origin 추가
- [ ] 프로덕션 환경에서 HTTPS 리다이렉트 설정

## 🚀 배포 전 확인사항

### 1. 환경변수 설정
```bash
# 필수 환경변수
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
PROD_URL=https://your-production-domain.com

# 선택적 환경변수
STAGING_URL=https://your-staging-domain.com
LOCAL_URL=http://localhost:3000
```

### 2. ALB 설정 확인
- **헬스체크 경로**: `/healthz` (기존 `/health`에서 변경 권장)
- **헬스체크 타임아웃**: 5초
- **헬스체크 간격**: 30초
- **정상 임계값**: 2
- **비정상 임계값**: 2

### 3. ECS Task Definition 업데이트
```json
{
  "environment": [
    {
      "name": "NODE_ENV",
      "value": "production"
    },
    {
      "name": "ALLOWED_ORIGINS",
      "value": "https://your-frontend-domain.com"
    },
    {
      "name": "PROD_URL",
      "value": "https://your-production-domain.com"
    }
  ]
}
```

### 4. 테스트 체크리스트
- [ ] `/healthz` 응답 확인 (200 OK)
- [ ] `/readyz` 응답 확인 (200 OK, DB/Redis 연결)
- [ ] `/api-docs` 접근 확인
- [ ] `/api-docs.json` 접근 확인
- [ ] CORS preflight 요청 확인
- [ ] 프론트엔드에서 API 호출 확인

## 📝 추가 권장사항

### 1. 보안 강화
- Helmet 미들웨어 추가 고려
- Rate limiting 설정
- API 키 인증 추가

### 2. 모니터링 강화
- Prometheus 메트릭 활용
- 로그 집중화 (CloudWatch)
- 알람 설정

### 3. 성능 최적화
- Redis 캐싱 전략
- 데이터베이스 인덱스 최적화
- CDN 설정

## 🔄 롤백 계획

1. **이전 태그로 롤백**
   ```bash
   git checkout <previous-tag>
   docker build -t mclass-server:rollback .
   ```

2. **ECS 서비스 업데이트**
   ```bash
   aws ecs update-service --cluster mclass-cluster --service mclass-service --task-definition mclass-task:rollback
   ```

3. **헬스체크 모니터링**
   - ALB 헬스체크 상태 확인
   - CloudWatch 로그 모니터링
   - 사용자 피드백 수집
