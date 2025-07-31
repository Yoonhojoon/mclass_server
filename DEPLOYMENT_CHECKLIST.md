# 배포 체크리스트

## 🚀 배포 전 확인사항

### 1. 코드 품질
- [ ] 모든 테스트 통과
- [ ] 린트 검사 통과
- [ ] 보안 취약점 없음
- [ ] 코드 리뷰 완료

### 2. 환경 설정
- [ ] GitHub Secrets 설정 완료
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `SNYK_TOKEN` (선택사항)
- [ ] AWS IAM 권한 확인
- [ ] ECR 리포지토리 생성
- [ ] ECS 클러스터 및 서비스 생성

### 3. 인프라 준비
- [ ] VPC 및 서브넷 설정
- [ ] Security Group 설정
- [ ] ALB 설정
- [ ] CloudWatch 로그 그룹 생성

### 4. 애플리케이션 설정
- [ ] 환경 변수 설정
- [ ] 헬스체크 엔드포인트 확인
- [ ] 포트 설정 확인 (3000)
- [ ] 로깅 설정 확인

## 🔄 배포 과정

### 1. 자동 배포 (GitHub Actions)
```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
```

### 2. 수동 배포 (필요시)
```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 빌드 및 푸시
docker build -t YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/mclass-server:latest .
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/mclass-server:latest

# ECS 서비스 업데이트
aws ecs update-service --cluster mclass-cluster --service mclass-service --force-new-deployment
```

## 📊 배포 후 확인사항

### 1. 서비스 상태 확인
```bash
# ECS 서비스 상태
aws ecs describe-services --cluster mclass-cluster --services mclass-service

# 태스크 상태
aws ecs list-tasks --cluster mclass-cluster --service-name mclass-service
```

### 2. 애플리케이션 확인
- [ ] ALB DNS 이름으로 접속 가능
- [ ] 헬스체크 통과
- [ ] API 엔드포인트 정상 작동
- [ ] 로그 확인

### 3. 모니터링
- [ ] CloudWatch 메트릭 확인
- [ ] 로그 스트림 확인
- [ ] 에러 로그 없음
- [ ] 성능 지표 정상

## 🚨 롤백 절차

### 1. 이전 버전으로 롤백
```bash
# 이전 태스크 정의 확인
aws ecs describe-task-definition --task-definition mclass-task

# 이전 버전으로 롤백
aws ecs update-service --cluster mclass-cluster --service mclass-service --task-definition mclass-task:이전버전
```

### 2. 긴급 롤백
```bash
# 서비스 중지
aws ecs update-service --cluster mclass-cluster --service mclass-service --desired-count 0

# 이전 버전으로 재시작
aws ecs update-service --cluster mclass-cluster --service mclass-service --desired-count 2
```

## 📝 배포 로그

### 배포 히스토리
| 날짜 | 버전 | 변경사항 | 담당자 | 상태 |
|------|------|----------|--------|------|
| 2024-01-XX | v1.0.0 | 초기 배포 | - | ✅ |

### 문제 해결
- **헬스체크 실패**: 애플리케이션 포트 및 엔드포인트 확인
- **메모리 부족**: Task Definition 메모리 증가
- **네트워크 문제**: Security Group 설정 확인
- **이미지 풀 에러**: ECR 권한 및 이미지 태그 확인 