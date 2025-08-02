# MClass Server

TypeScript Express 서버 with 모니터링

## 📁 파일 구조

### Docker 파일들
- `Dockerfile` - 프로덕션 빌드 (AWS ECS용)
- `Dockerfile.dev` - 개발 환경 빌드
- `docker-compose.yml` - 프로덕션 모니터링 스택
- `docker-compose.dev.yml` - 개발 모니터링 스택

### 설정 파일들
- `prometheus.yml` - 프로메테우스 설정
- `task-definition.json` - ECS 태스크 정의
- `grafana/` - Grafana 대시보드 설정

## 🚀 사용법

### 로컬 개발
```bash
# 기본 개발
npm run dev

# 개발 + 모니터링
docker-compose -f docker-compose.dev.yml up
```

### 프로덕션 배포
```bash
# GitHub Actions가 자동 처리
# 또는 수동:
docker build -t mclass-server .
```

### 모니터링 접속
- **로컬**: http://localhost:3001 (Grafana)
- **프로덕션**: AWS ECS 서비스 IP:3000

## 📊 모니터링

- **Prometheus**: 메트릭 수집
- **Grafana**: 대시보드 시각화
- **메트릭**: HTTP 요청, 응답시간, CPU/메모리 사용률 