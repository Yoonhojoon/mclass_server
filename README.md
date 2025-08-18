# 🎓 MClass Server

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)

**TypeScript와 Express를 기반으로 한 mclass 백엔드 서버**

[🚀 빠른 시작](#-빠른-시작) • [📚 API 문서](#-api-문서) • [🏗️ 아키텍처](#️-아키텍처) • [🔧 개발 가이드](#-개발-가이드)

</div>

---

## ✨ 주요 기능

### 🔐 인증 및 보안
- **JWT 기반 인증** (Access Token + Refresh Token)
- **Redis 기반 토큰 저장소** - 사용자별 세션 관리
- **소셜 로그인** - Google, Kakao, Naver OAuth 지원
- **다중 기기 로그인** - 동시 세션 관리

### 🎯 핵심 비즈니스 로직
- **M클래스 관리** - 교육 콘텐츠 CRUD
- **수강신청 시스템** - 신청/취소/상태 관리
- **사용자 관리** - 프로필 및 권한 관리
- **관리자 대시보드** - 통계 및 모니터링

### 🛠️ 개발자 경험
- **TypeScript** - 타입 안전성과 개발 생산성
- **Prisma ORM** - 데이터베이스 스키마 관리
- **Swagger/OpenAPI** - 자동 API 문서 생성
- **Jest** - 단위/통합 테스트

### 📊 모니터링 및 운영
- **Prometheus** - 메트릭 수집
- **Grafana** - 실시간 대시보드
- **Docker** - 컨테이너화
- **AWS ECS** - 클라우드 배포

---

## 🚀 빠른 시작

### 📋 요구사항

- **Node.js** 20.x 이상
- **Docker** & Docker Compose
- **PostgreSQL** (Docker로 제공)

### 🛠️ 설치 및 실행

#### 1. 저장소 클론
```bash
git clone https://github.com/Yoonhojoon/mclass_server.git
cd mclass_server
```

#### 2. 의존성 설치
```bash
npm install
```

#### 3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 설정을 추가
```

#### 4. 개발 환경 실행
```bash
# PostgreSQL과 함께 전체 스택 실행
docker-compose -f docker-compose.dev.yml up --build

# 또는 로컬 개발 (PostgreSQL 별도 설치 필요)
npm run dev
```

#### 5. 데이터베이스 마이그레이션
```bash
npx prisma migrate dev
npx prisma generate
```

---

## 🌐 접속 URL

| 서비스 | URL | 설명 |
|--------|-----|------|
| **애플리케이션** | http://localhost:3000 | 메인 API 서버 |
| **API 문서** | http://localhost:3000/api-docs | Swagger UI |
| **메트릭** | http://localhost:3000/metrics | Prometheus 메트릭 |
| **헬스체크** | http://localhost:3000/health | 서버 상태 확인 |
| **PgAdmin** | http://localhost:8080 | 데이터베이스 관리 |

---

## 🏗️ 아키텍처

### 📁 프로젝트 구조 (Domain-Driven Design)

```
src/
├── domains/              # 도메인별 비즈니스 로직
│   ├── auth/            # 인증 및 권한 관리
│   ├── user/            # 사용자 관리
│   ├── mclass/          # M클래스 관리
│   ├── enrollment/      # 수강신청 관리
│   ├── term/            # 학기 관리
│   └── admin/           # 관리자 기능
├── config/              # 설정 파일들
├── middleware/          # Express 미들웨어
├── services/            # 공통 서비스
├── common/              # 공통 유틸리티
└── __tests__/           # 테스트 파일들
```

### 🔧 기술 스택

| 카테고리 | 기술 | 버전 | 용도 |
|----------|------|------|------|
| **런타임** | Node.js | 20.x | 서버 런타임 |
| **언어** | TypeScript | 5.x | 타입 안전성 |
| **프레임워크** | Express.js | 5.x | 웹 프레임워크 |
| **데이터베이스** | PostgreSQL | 15.x | 메인 데이터베이스 |
| **캐시** | Redis | 7.x | 세션 및 토큰 저장 |
| **ORM** | Prisma | 6.x | 데이터베이스 ORM |
| **인증** | JWT | - | 토큰 기반 인증 |
| **문서화** | Swagger | - | API 문서 |
| **테스트** | Jest | 30.x | 테스트 프레임워크 |
| **컨테이너** | Docker | - | 컨테이너화 |
| **모니터링** | Prometheus | - | 메트릭 수집 |
| **대시보드** | Grafana | - | 시각화 |

---

## 📚 API 문서

### 🚀 API 사용 가이드

#### 일반 사용자 흐름
```mermaid
graph TD
    A[사용자] --> B[회원가입/로그인]
    B --> C[JWT 토큰 발급]
    C --> D[클래스 목록 조회]
    D --> E[클래스 상세 정보 확인]
    E --> F[수강신청]
    F --> G[내 신청 목록 확인]
    G --> H[신청 상태 관리]
```

#### 관리자 흐름
```mermaid
graph TD
    A[관리자] --> B[관리자 로그인]
    B --> C[대시보드 확인]
    C --> D[사용자 관리]
    C --> E[클래스 관리]
    C --> F[신청 내역 관리]
    D --> G[사용자 정보 수정/삭제]
    E --> H[클래스 생성/수정/삭제]
    F --> I[신청 상태 변경]
```

### 📋 API 사용 순서

#### 1️⃣ 인증 (필수)
```bash
# 1. 회원가입 또는 소셜 로그인
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/google|kakao|naver

# 2. JWT 토큰 확인
# 응답에서 accessToken과 refreshToken을 받습니다
```

#### 2️⃣ 클래스 탐색
```bash
# 3. 클래스 목록 조회
GET /api/classes

# 4. 특정 클래스 상세 정보 확인
GET /api/classes/:id
```

#### 3️⃣ 수강신청
```bash
# 5. 클래스 신청
POST /api/enrollments
Authorization: Bearer <access_token>

# 6. 내 신청 목록 확인
GET /api/enrollments
Authorization: Bearer <access_token>
```

#### 4️⃣ 사용자 관리
```bash
# 7. 내 정보 조회/수정
GET /api/users/:id
PUT /api/users/:id
Authorization: Bearer <access_token>
```

#### 5️⃣ 세션 관리
```bash
# 8. 토큰 갱신 (필요시)
POST /api/auth/refresh

# 9. 로그아웃
POST /api/auth/logout
Authorization: Bearer <access_token>
```

### 🔐 인증 API

#### 기본 인증
```http
POST /api/auth/register     # 회원가입
POST /api/auth/login        # 로그인
POST /api/auth/refresh      # 토큰 갱신
POST /api/auth/logout       # 로그아웃
```

#### 소셜 로그인
```http
GET  /api/auth/google       # Google OAuth
GET  /api/auth/kakao        # Kakao OAuth
GET  /api/auth/naver        # Naver OAuth
GET  /api/auth/social/status # 소셜 로그인 상태
```

#### 세션 관리
```http
GET  /api/auth/sessions           # 사용자 세션 조회
POST /api/auth/logout-device      # 특정 기기 로그아웃
POST /api/auth/logout-all-devices # 모든 기기 로그아웃
```

### 👥 사용자 관리 API

```http
GET    /api/users          # 사용자 목록 조회
GET    /api/users/:id      # 특정 사용자 조회
POST   /api/users          # 사용자 생성
PUT    /api/users/:id      # 사용자 정보 수정
DELETE /api/users/:id      # 사용자 삭제
```

### 🎓 M클래스 관리 API

```http
GET    /api/classes        # 클래스 목록 조회
GET    /api/classes/:id    # 특정 클래스 조회
POST   /api/classes        # 클래스 생성
PUT    /api/classes/:id    # 클래스 정보 수정
DELETE /api/classes/:id    # 클래스 삭제
```

### 📝 수강신청 API

```http
GET    /api/enrollments    # 내 신청 목록 조회
POST   /api/enrollments    # 클래스 신청
PUT    /api/enrollments/:id # 신청 상태 변경
DELETE /api/enrollments/:id # 신청 취소
```

### 👨‍💼 관리자 API

```http
GET    /api/admin/dashboard    # 관리자 대시보드
GET    /api/admin/users        # 사용자 관리
GET    /api/admin/classes      # 클래스 관리
GET    /api/admin/enrollments  # 신청 내역 관리
GET    /api/admin/logs         # 시스템 로그
```

### 💡 API 사용 예시

#### 회원가입 및 로그인
```bash
# 1. 회원가입
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "홍길동"
  }'

# 응답 예시
{
  "success": true,
  "message": "회원가입 성공",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "홍길동",
      "role": "USER"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}

# 2. 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### 클래스 조회 및 신청
```bash
# 3. 클래스 목록 조회
curl -X GET http://localhost:3000/api/classes

# 4. 특정 클래스 상세 정보
curl -X GET http://localhost:3000/api/classes/class-id

# 5. 클래스 신청 (인증 필요)
curl -X POST http://localhost:3000/api/enrollments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "class-id",
    "userId": "user-id"
  }'

# 6. 내 신청 목록 확인
curl -X GET http://localhost:3000/api/enrollments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 토큰 갱신 및 로그아웃
```bash
# 7. 토큰 갱신
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'

# 8. 로그아웃
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 📝 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "message": "작업 성공 메시지",
  "data": {
    // 실제 데이터
  }
}
```

#### 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": {
    "code": "ERROR_CODE",
    "details": "상세 에러 정보"
  }
}
```

### 🔍 HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| `200` | OK | 요청 성공 |
| `201` | Created | 리소스 생성 성공 |
| `400` | Bad Request | 잘못된 요청 |
| `401` | Unauthorized | 인증 실패 |
| `403` | Forbidden | 권한 없음 |
| `404` | Not Found | 리소스 없음 |
| `409` | Conflict | 리소스 충돌 |
| `500` | Internal Server Error | 서버 오류 |

### ⚠️ 주의사항

1. **인증이 필요한 API**: `Authorization: Bearer <access_token>` 헤더 필수
2. **토큰 만료**: Access Token은 24시간, Refresh Token은 7일
3. **요청 제한**: API 호출 횟수 제한이 있을 수 있음
4. **데이터 형식**: 모든 요청은 `Content-Type: application/json` 사용

---

## 🔧 개발 가이드

### 🧪 테스트

```bash
# 단위 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage

# 테스트 감시 모드
npm run test:watch
```

### 🔍 코드 품질

```bash
# 린팅
npm run lint

# 린팅 자동 수정
npm run lint:fix

# 코드 포맷팅
npm run format

# 타입 체크
npm run build
```

### 🐳 Docker 개발

```bash
# 개발 환경 실행
docker-compose -f docker-compose.dev.yml up --build

# 프로덕션 환경 실행
docker-compose up --build

# 특정 서비스만 실행
docker-compose -f docker-compose.dev.yml up postgres redis
```

---

## 🔐 소셜 로그인 설정

### Google OAuth2.0

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI 추가: `http://localhost:3000/api/auth/google/callback`
4. 환경변수 설정:
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

### Kakao OAuth

1. [Kakao Developers](https://developers.kakao.com/)에서 애플리케이션 생성
2. 웹 플랫폼 추가 및 카카오 로그인 활성화
3. 리디렉션 URI 설정: `http://localhost:3000/api/auth/kakao/callback`
4. 환경변수 설정:
   ```bash
   KAKAO_CLIENT_ID=your-kakao-client-id
   KAKAO_CLIENT_SECRET=your-kakao-client-secret
   ```

### Naver OAuth

1. [Naver Developers](https://developers.naver.com/)에서 애플리케이션 생성
2. 서비스 URL 및 Callback URL 설정
3. 환경변수 설정:
   ```bash
   NAVER_CLIENT_ID=your-naver-client-id
   NAVER_CLIENT_SECRET=your-naver-client-secret
   ```

---

## ☁️ AWS 배포

### ECS 배포 가이드

#### 1. 인프라 생성
```bash
cd infrastructure
terraform init
terraform apply
```

#### 2. Docker 이미지 빌드 및 푸시
```bash
# 이미지 빌드
docker build -t mclass-server .

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin [ECR_URL]

# 이미지 태그 및 푸시
docker tag mclass-server:latest [ECR_URL]:latest
docker push [ECR_URL]:latest
```

#### 3. ECS 서비스 배포
```bash
# ECS 서비스 업데이트
aws ecs update-service --cluster mclass-cluster --service mclass-service --force-new-deployment
```

---

## 📊 모니터링

### Prometheus 메트릭

- **HTTP 요청 수** - 엔드포인트별 요청 통계
- **응답 시간** - 평균/최대/최소 응답 시간
- **에러율** - HTTP 상태 코드별 에러 비율
- **데이터베이스 연결** - DB 연결 상태 및 성능

### Grafana 대시보드

- **애플리케이션 성능** - 실시간 성능 지표
- **데이터베이스 성능** - 쿼리 성능 및 연결 풀 상태
- **시스템 리소스** - CPU, 메모리, 디스크 사용량
- **비즈니스 메트릭** - 사용자 활동 및 클래스 통계

---

## 🔧 환경 변수

### 기본 설정
```bash
# 서버 설정
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# 데이터베이스
DATABASE_URL=postgresql://postgres:password@localhost:5432/mclass_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```


---

## 🤝 기여하기

1. **Fork** the Project
2. **Create** your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your Changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the Branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### 개발 가이드라인

- **코드 스타일**: ESLint + Prettier 규칙 준수
- **테스트**: 새로운 기능에 대한 테스트 코드 작성
- **문서화**: API 변경사항 문서 업데이트
- **커밋 메시지**: 명확하고 설명적인 커밋 메시지 작성

---

## 📝 라이센스

이 프로젝트는 **ISC License** 하에 배포됩니다.

---

## 📞 문의

프로젝트에 대한 문의사항이나 버그 리포트는 [Issues](https://github.com/Yoonhojoon/mclass_server/issues)를 통해 제출해주세요.

---

<div align="center">

**MClass Server** - 현대적인 교육 플랫폼을 위한 강력한 백엔드 서버

⭐ **Star** this repository if you found it helpful!

</div> 