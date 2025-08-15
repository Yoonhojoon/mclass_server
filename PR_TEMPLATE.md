## ✅ 연관된 이슈

> 이슈 번호를 작성해주세요

- 퍼블릭 ALB 환경에서 Prometheus가 안전하게 mclass-server의 /metrics를 스크레이프하도록 구성

<br>

## 🛠️ 작업 내용

> 이번 PR에서 작업한 내용을 설명해주세요(이미지 및 동영상 첨부 가능)

### 🔒 메트릭 엔드포인트 보안 강화

1. **토큰 기반 인증 추가**
   - `/metrics` 엔드포인트에 Bearer 토큰 인증 미들웨어 추가
   - 환경변수 `METRICS_TOKEN`을 통한 안전한 토큰 관리
   - SSM Parameter Store에 토큰 안전 저장

2. **IP 기반 접근 제한**
   - ALB 리스너 규칙으로 VPC 내부 IP(10.0.0.0/16)에서만 `/metrics` 접근 허용
   - 외부 IP에서 접근 시 403 Forbidden 응답
   - 이중 보안: 토큰 인증 + IP 제한

3. **Prometheus 설정 개선**
   - HTTP 스키마 사용 (ALB 80 포트)
   - Bearer 토큰 인증 설정
   - EFS 볼륨 마운트로 토큰 파일 관리

### 🏗️ 인프라 구성 개선

1. **Terraform 설정 추가**
   - ALB 리스너 규칙 추가 (`aws_lb_listener_rule.allow_metrics_internal`)
   - EFS 파일 시스템 및 마운트 타겟 구성
   - Prometheus ECS Task Definition에 토큰 환경변수 추가

2. **보안 그룹 구성**
   - EFS 보안 그룹 추가 (Prometheus에서만 접근 허용)
   - 기존 보안 그룹 규칙 유지

### 📚 문서화 및 도구

1. **문서 추가**
   - `docs/observability.md`: 상세한 관찰성 가이드
   - `DEPLOYMENT_GUIDE.md`: 배포 가이드
   - 트러블슈팅 가이드 및 장기 개선 계획 포함

2. **검증 도구**
   - `scripts/verify-metrics.ps1`: PowerShell용 메트릭 검증 스크립트
   - 토큰 없이/잘못된 토큰/올바른 토큰으로 접근 테스트
   - 컬러 출력으로 결과 명확히 표시

### 🔍 주요 변경사항

**파일 추가:**
- `docs/observability.md` - 관찰성 가이드
- `DEPLOYMENT_GUIDE.md` - 배포 가이드  
- `scripts/verify-metrics.ps1` - PowerShell 검증 스크립트
- `PR_TEMPLATE.md` - PR 템플릿

**파일 수정:**
- `src/middleware/monitoring.ts` - 토큰 인증 미들웨어 추가
- `src/index.ts` - 메트릭 엔드포인트에 토큰 보호 적용
- `infrastructure/main.tf` - ALB 규칙, EFS, 보안 그룹 추가
- `infrastructure/variables.tf` - metrics_token 변수 추가
- `prometheus.yml` - HTTP 스키마 및 토큰 인증 설정

### ✅ 검증 결과

- ✅ 토큰 없이 접근 시 401/403 응답
- ✅ 잘못된 토큰으로 접근 시 401 응답  
- ✅ 올바른 토큰으로 접근 시 200 응답 + 메트릭 데이터
- ✅ VPC 내부 IP 제한으로 외부 접근 차단
- ✅ Prometheus 타겟 UP 상태 확인 가능

<br>

## 🙋 리뷰 요구사항 (선택)

> 리뷰어가 특별히 봐주었으면 하는 부분이나 질문이 있다면 작성해주세요

- 메트릭 엔드포인트의 보안 설정이 적절한지 확인 부탁드립니다
- ALB 리스너 규칙의 우선순위 설정이 올바른지 검토 부탁드립니다
- EFS 볼륨 마운트 구성이 최적화되었는지 확인 부탁드립니다
- PowerShell 검증 스크립트의 오류 처리가 충분한지 검토 부탁드립니다
