# MClass 서버 배포 가이드

## 개요

이 가이드는 MClass 서버를 AWS ECS에 배포하고 Prometheus 메트릭 수집을 설정하는 방법을 설명합니다.

## 사전 요구사항

- AWS CLI 설치 및 구성
- Terraform 설치 (v1.0+)
- Docker 설치
- Node.js 18+ 설치

## 1. 환경변수 설정

### 1.1 필수 환경변수

```bash
# JWT 시크릿 (무작위 32자리 문자열)
export JWT_SECRET="your-jwt-secret-here"

# 데이터베이스 비밀번호
export DATABASE_PASSWORD="your-database-password"

# Redis URL
export REDIS_URL="redis://your-redis-endpoint:6379"

# OAuth 클라이언트 정보
export KAKAO_CLIENT_ID="your-kakao-client-id"
export KAKAO_CLIENT_SECRET="your-kakao-client-secret"
export GOOGLE_CLIENT_ID="your-google-client-id"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"
export NAVER_CLIENT_ID="your-naver-client-id"
export NAVER_CLIENT_SECRET="your-naver-client-secret"

# 초기 관리자 계정
export INITIAL_ADMIN_EMAIL="admin@example.com"
export INITIAL_ADMIN_PASSWORD="secure-password"
export INITIAL_ADMIN_NAME="관리자"

# Prometheus 메트릭 토큰 (무작위 64자리 문자열 권장)
export METRICS_TOKEN="your-secure-metrics-token-here"
```

### 1.2 토큰 생성 스크립트

```bash
# JWT 시크릿 생성
export JWT_SECRET=$(openssl rand -hex 32)

# 메트릭 토큰 생성
export METRICS_TOKEN=$(openssl rand -hex 32)

echo "JWT_SECRET: $JWT_SECRET"
echo "METRICS_TOKEN: $METRICS_TOKEN"
```

## 2. Terraform 배포

### 2.1 초기화

```bash
cd infrastructure
terraform init
```

### 2.2 변수 파일 생성

```bash
# terraform.tfvars 파일 생성
cat > terraform.tfvars << EOF
jwt_secret = "$JWT_SECRET"
database_password = "$DATABASE_PASSWORD"
redis_url = "$REDIS_URL"
kakao_client_id = "$KAKAO_CLIENT_ID"
kakao_client_secret = "$KAKAO_CLIENT_SECRET"
google_client_id = "$GOOGLE_CLIENT_ID"
google_client_secret = "$GOOGLE_CLIENT_SECRET"
naver_client_id = "$NAVER_CLIENT_ID"
naver_client_secret = "$NAVER_CLIENT_SECRET"
initial_admin_email = "$INITIAL_ADMIN_EMAIL"
initial_admin_password = "$INITIAL_ADMIN_PASSWORD"
initial_admin_name = "$INITIAL_ADMIN_NAME"
metrics_token = "$METRICS_TOKEN"
EOF
```

### 2.3 배포 계획 확인

```bash
terraform plan
```

### 2.4 배포 실행

```bash
terraform apply
```

배포가 완료되면 다음 출력을 확인하세요:
- `alb_dns_name`: ALB DNS 이름
- `ecr_repository_url`: ECR 저장소 URL

## 3. 애플리케이션 빌드 및 배포

### 3.1 Docker 이미지 빌드

```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin $(terraform -chdir=infrastructure output -raw ecr_repository_url | cut -d'/' -f1)

# 이미지 빌드
docker build -t mclass-server .

# 태그 지정
docker tag mclass-server:latest $(terraform -chdir=infrastructure output -raw ecr_repository_url):latest

# 푸시
docker push $(terraform -chdir=infrastructure output -raw ecr_repository_url):latest
```

### 3.2 ECS 서비스 업데이트

```bash
# ECS 서비스 강제 업데이트
aws ecs update-service \
  --cluster mclass-cluster \
  --service mclass-service \
  --force-new-deployment
```

## 4. 메트릭 설정

### 4.1 Prometheus 설정 업데이트

`prometheus.yml` 파일에서 ALB DNS 이름을 실제 값으로 변경:

```yaml
scrape_configs:
  - job_name: 'mclass-server'
    static_configs:
      - targets: ['YOUR_ALB_DNS_NAME:80']  # 실제 ALB DNS 이름으로 변경
    metrics_path: '/metrics'
    scrape_interval: 5s
    scheme: 'http'
    authorization:
      type: Bearer
      credentials_file: /etc/prometheus/secrets/metrics_token
```

### 4.2 EFS에 토큰 파일 업로드

```bash
# EFS 마운트 (임시)
sudo mkdir -p /mnt/efs
sudo mount -t efs $(terraform -chdir=infrastructure output -raw efs_file_system_id):/ /mnt/efs

# 토큰 파일 생성
echo "$METRICS_TOKEN" > /mnt/efs/secrets/metrics_token

# 권한 설정
chmod 600 /mnt/efs/secrets/metrics_token

# 마운트 해제
sudo umount /mnt/efs
```

### 4.3 Prometheus 서비스 재시작

```bash
aws ecs update-service \
  --cluster mclass-cluster \
  --service mclass-prometheus-service \
  --force-new-deployment
```

## 5. 검증

### 5.1 메트릭 엔드포인트 검증

```bash
# 검증 스크립트 실행
./scripts/verify-metrics.sh \
  $(terraform -chdir=infrastructure output -raw alb_dns_name) \
  "$METRICS_TOKEN"
```

### 5.2 Prometheus 타겟 확인

1. Prometheus UI 접속: `http://prometheus-ip:9090`
2. Status > Targets에서 `mclass-server`가 UP 상태인지 확인
3. Graph에서 `up{job="mclass-server"}` 쿼리 실행

### 5.3 Grafana 대시보드 확인

1. Grafana UI 접속: `http://grafana-ip:3000`
2. 기본 계정: `admin` / `admin123`
3. Prometheus 데이터 소스 추가
4. 대시보드 생성

## 6. 모니터링

### 6.1 로그 확인

```bash
# MClass 서버 로그
aws logs tail /ecs/mclass-task --follow

# Prometheus 로그
aws logs tail /ecs/mclass-prometheus-task --follow

# Grafana 로그
aws logs tail /ecs/mclass-grafana-task --follow
```

### 6.2 메트릭 확인

```bash
# 메트릭 엔드포인트 직접 확인
curl -H "Authorization: Bearer $METRICS_TOKEN" \
  "http://$(terraform -chdir=infrastructure output -raw alb_dns_name):80/metrics"
```

## 7. 문제 해결

### 7.1 일반적인 문제들

#### ECS 서비스가 시작되지 않는 경우
```bash
# 태스크 정의 확인
aws ecs describe-task-definition --task-definition mclass-task

# 서비스 이벤트 확인
aws ecs describe-services --cluster mclass-cluster --services mclass-service
```

#### 메트릭 엔드포인트 접근 불가
```bash
# ALB 리스너 규칙 확인
aws elbv2 describe-listener-rules --listener-arn $(terraform -chdir=infrastructure output -raw alb_listener_arn)

# 보안 그룹 확인
aws ec2 describe-security-groups --group-ids $(terraform -chdir=infrastructure output -raw alb_security_group_id)
```

#### Prometheus 타겟이 DOWN인 경우
```bash
# 토큰 확인
aws ssm get-parameter --name "/mclass/metrics_token" --with-decryption

# 네트워크 연결 확인
aws ec2 describe-network-interfaces --filters "Name=group-id,Values=$(terraform -chdir=infrastructure output -raw prometheus_security_group_id)"
```

### 7.2 로그 분석

```bash
# 최근 오류 로그 확인
aws logs filter-log-events \
  --log-group-name /ecs/mclass-task \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000
```

## 8. 정리

### 8.1 리소스 삭제

```bash
# Terraform으로 생성된 모든 리소스 삭제
terraform destroy
```

### 8.2 수동 리소스 정리

```bash
# ECR 이미지 삭제
aws ecr batch-delete-image \
  --repository-name mclass-server \
  --image-ids imageTag=latest

# CloudWatch 로그 그룹 삭제
aws logs delete-log-group --log-group-name /ecs/mclass-task
aws logs delete-log-group --log-group-name /ecs/mclass-prometheus-task
aws logs delete-log-group --log-group-name /ecs/mclass-grafana-task
```

## 9. 보안 고려사항

1. **토큰 관리**: METRICS_TOKEN은 정기적으로 교체하세요
2. **네트워크 보안**: VPC 내부에서만 메트릭 접근이 가능하도록 설정되어 있습니다
3. **IAM 권한**: 최소 권한 원칙에 따라 IAM 역할을 구성하세요
4. **로깅**: 모든 접근 로그를 모니터링하세요

## 10. 비용 최적화

1. **ECS Fargate**: 사용량에 따라 CPU/메모리 조정
2. **RDS**: 프리티어 사용 중이므로 사용량 모니터링 필요
3. **ALB**: 트래픽이 적을 때는 비용 고려
4. **EFS**: 메트릭 토큰 저장용으로만 사용하므로 최소 스토리지

## 참고 자료

- [AWS ECS 공식 문서](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Prometheus 공식 문서](https://prometheus.io/docs/)
- [Grafana 공식 문서](https://grafana.com/docs/)
