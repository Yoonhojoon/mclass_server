# ECR + ECS 무중단 배포 가이드

## 개요
이 프로젝트는 AWS ECR(Elastic Container Registry)과 ECS(Elastic Container Service)를 사용하여 무중단 배포를 구현합니다.

## 아키텍처
- **ECR**: Docker 이미지 저장소
- **ECS Fargate**: 서버리스 컨테이너 실행 환경
- **Application Load Balancer**: 트래픽 분산 및 헬스체크
- **GitHub Actions**: CI/CD 파이프라인

## 사전 준비

### 1. AWS CLI 설정
```bash
aws configure
```

### 2. GitHub Secrets 설정
GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 시크릿을 설정하세요:

- `AWS_ACCESS_KEY_ID`: AWS 액세스 키 ID
- `AWS_SECRET_ACCESS_KEY`: AWS 시크릿 액세스 키

### 3. AWS IAM 권한
다음 권한이 필요합니다:
- ECR 관련 권한
- ECS 관련 권한
- IAM 역할 생성 권한
- CloudWatch Logs 권한

## 배포 단계

### 1. 인프라 생성 (Terraform)
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 2. 로컬 테스트
```bash
# Docker 이미지 빌드
docker build -t mclass-server .

# 로컬에서 실행
docker run -p 3000:3000 mclass-server
```

### 3. ECR에 이미지 푸시
```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 태그
docker tag mclass-server:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/mclass-server:latest

# 이미지 푸시
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/mclass-server:latest
```

### 4. ECS 서비스 업데이트
```bash
# Task Definition 등록
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 서비스 업데이트
aws ecs update-service --cluster mclass-cluster --service mclass-service --task-definition mclass-task
```

## 무중단 배포 원리

### Blue-Green 배포
1. **Blue 환경**: 현재 실행 중인 서비스
2. **Green 환경**: 새로운 버전을 배포할 환경
3. **트래픽 전환**: ALB가 새로운 환경으로 트래픽을 전환
4. **검증**: 새 환경이 정상 작동하는지 확인
5. **정리**: 이전 환경 정리

### ECS 배포 전략
- **Rolling Update**: 기존 태스크를 하나씩 새 태스크로 교체
- **Minimum healthy percent**: 최소 50%의 태스크가 항상 실행되도록 보장
- **Maximum percent**: 최대 200%까지 태스크를 실행하여 무중단 보장

## 모니터링

### CloudWatch 로그
```bash
# 로그 그룹 확인
aws logs describe-log-groups --log-group-name-prefix "/ecs/mclass-task"

# 로그 스트림 확인
aws logs describe-log-streams --log-group-name "/ecs/mclass-task"
```

### ECS 서비스 상태 확인
```bash
# 서비스 상태 확인
aws ecs describe-services --cluster mclass-cluster --services mclass-service

# 태스크 상태 확인
aws ecs list-tasks --cluster mclass-cluster --service-name mclass-service
```

## 트러블슈팅

### 일반적인 문제들

1. **이미지 풀 에러**
   - ECR 권한 확인
   - 이미지 태그 확인

2. **헬스체크 실패**
   - 애플리케이션 포트 확인
   - 헬스체크 엔드포인트 확인

3. **메모리 부족**
   - Task Definition의 메모리 설정 증가
   - 애플리케이션 메모리 사용량 최적화

4. **네트워크 연결 문제**
   - Security Group 설정 확인
   - VPC 설정 확인

## 비용 최적화

### 권장사항
- **Spot 인스턴스 사용**: 비용 절약 (단, 프로덕션에서는 신중히 고려)
- **Auto Scaling**: 트래픽에 따른 자동 스케일링
- **리소스 모니터링**: CloudWatch를 통한 사용량 추적

### 예상 비용 (월)
- ECS Fargate: ~$30-50 (2개 태스크 기준)
- ALB: ~$20
- ECR: ~$5-10
- CloudWatch: ~$5-10

## 보안 고려사항

1. **IAM 역할 최소 권한 원칙**
2. **Security Group 제한적 설정**
3. **ECR 이미지 스캔 활성화**
4. **HTTPS 적용 (필요시)**
5. **환경 변수 암호화**

## 추가 개선사항

1. **CDN 추가**: CloudFront 연동
2. **데이터베이스**: RDS 또는 Aurora 연동
3. **캐싱**: ElastiCache 연동
4. **모니터링**: X-Ray, CloudWatch 대시보드
5. **알림**: SNS를 통한 알림 설정 