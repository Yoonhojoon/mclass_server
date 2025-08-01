# MClass Server

TypeScript와 Express를 사용한 Node.js 서버 프로젝트입니다.

## 🚀 빠른 시작

### 1. 로컬 개발 (Docker 없이)
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (핫 리로드)
npm run dev

# 접속: http://localhost:3000
```

### 2. Docker로 개발
```bash
# 개발 모드 (핫 리로드)
docker-compose -f docker-compose.dev.yml up -d

# 프로덕션 모드
docker-compose up -d

# 접속: http://localhost:3000
```

### 3. 모니터링 스택 실행
```bash
# Grafana + Prometheus만 실행
docker-compose -f docker-compose.grafana.yml up -d

# 접속:
# - Grafana: http://localhost:3001 (admin/admin123)
# - Prometheus: http://localhost:9090
```

## 📦 Docker 사용법

### 개발 환경
```bash
# 핫 리로드로 개발
docker-compose -f docker-compose.dev.yml up -d

# 로그 확인
docker-compose -f docker-compose.dev.yml logs app

# 중지
docker-compose -f docker-compose.dev.yml down
```

### 프로덕션 환경
```bash
# 전체 스택 실행
docker-compose up -d

# 특정 서비스만 실행
docker-compose up app grafana

# 중지
docker-compose down
```

## ☁️ AWS 배포

### 1. 인프라 배포
```bash
cd infrastructure

# Terraform 초기화
terraform init

# 배포 계획 확인
terraform plan

# 인프라 배포
terraform apply
```

### 2. 애플리케이션 배포
```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin [AWS-ACCOUNT-ID].dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 빌드 및 푸시
docker build -t mclass-server .
docker tag mclass-server:latest [AWS-ACCOUNT-ID].dkr.ecr.ap-northeast-2.amazonaws.com/mclass-server:latest
docker push [AWS-ACCOUNT-ID].dkr.ecr.ap-northeast-2.amazonaws.com/mclass-server:latest
```

### 3. 접속 정보
- **애플리케이션**: `http://[ALB-DNS-NAME]/`
- **Grafana**: `http://[ALB-DNS-NAME]:3001/`

## 🔧 주요 명령어

### 로컬 개발
```bash
npm install          # 의존성 설치
npm run dev         # 개발 서버 (핫 리로드)
npm run build       # TypeScript 컴파일
npm start           # 프로덕션 실행
npm test            # 테스트 실행
npm run lint        # 코드 검사
```

### Docker
```bash
# 개발 환경
docker-compose -f docker-compose.dev.yml up -d

# 프로덕션 환경
docker-compose up -d

# 모니터링만
docker-compose -f docker-compose.grafana.yml up -d
```

### AWS
```bash
# 인프라 배포
cd infrastructure && terraform apply

# 애플리케이션 배포
docker build -t mclass-server .
docker push [ECR-URL]:latest
```

## 📁 프로젝트 구조

```
mclass_server/
├── src/                    # TypeScript 소스 코드
├── dist/                   # 컴파일된 JavaScript
├── infrastructure/         # AWS Terraform 설정
├── grafana/               # Grafana 대시보드 설정
├── docker-compose.yml     # 프로덕션 Docker 설정
├── docker-compose.dev.yml # 개발 Docker 설정
├── Dockerfile             # 프로덕션 이미지
├── Dockerfile.dev         # 개발 이미지
└── package.json           # 프로젝트 설정
```

## 🌐 접속 URL

### 로컬 개발
- **애플리케이션**: http://localhost:3000
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090

### AWS 프로덕션
- **애플리케이션**: http://[ALB-DNS-NAME]/
- **Grafana**: http://[ALB-DNS-NAME]:3001/

## 📊 모니터링

- **CloudWatch**: AWS 콘솔에서 로그 확인
- **Grafana**: 대시보드 및 메트릭 시각화
- **Prometheus**: 메트릭 수집
- **ECS**: 컨테이너 상태 모니터링

## 🛠️ 문제 해결

### Docker 관련
```bash
# 컨테이너 로그 확인
docker-compose logs [서비스명]

# 컨테이너 재시작
docker-compose restart [서비스명]

# 볼륨 삭제
docker-compose down -v
```

### AWS 관련
```bash
# ECS 서비스 상태 확인
aws ecs describe-services --cluster mclass-cluster --services mclass-service

# 로그 확인
aws logs tail /ecs/mclass-task --follow
``` 