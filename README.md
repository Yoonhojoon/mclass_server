# MClass Server

TypeScript와 Express를 사용한 Node.js 서버 애플리케이션입니다.

## 🚀 기능

- **TypeScript** 기반 Express 서버
- **PostgreSQL** 데이터베이스 연동
- **JWT** 기반 인증 (Access Token + Refresh Token)
- **소셜 로그인** (Google, Kakao, Naver OAuth)
- **Swagger** API 문서 자동 생성
- **Prometheus** 메트릭 수집
- **Grafana** 대시보드
- **Docker** 컨테이너화
- **AWS ECS** 배포 지원

## 📋 요구사항

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (Docker로 제공)

## 🛠️ 설치 및 실행

### 1. 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 환경 실행 (PostgreSQL 포함)
docker-compose -f docker-compose.dev.yml up --build
```

### 2. 프로덕션 환경 설정

```bash
# 프로덕션 환경 실행
docker-compose up --build
```

### 3. 로컬 개발 (Docker 없이)

```bash
# PostgreSQL 설치 후
npm run dev
```

## 🌐 접속 URL

- **애플리케이션**: http://localhost:3000
- **API 문서**: http://localhost:3000/api-docs
- **메트릭**: http://localhost:3000/metrics
- **헬스체크**: http://localhost:3000/health
- **PgAdmin** (개발용): http://localhost:8080

## 📊 데이터베이스

### PostgreSQL 설정

- **호스트**: localhost (개발) / postgres (Docker)
- **포트**: 5432
- **데이터베이스**: mclass_dev (개발) / mclass_prod (프로덕션)
- **사용자**: 
- **비밀번호**: 
### 환경변수

```bash
# 기본 설정
DATABASE_URL=postgresql://postgres:password@localhost:5432/mclass_dev
NODE_ENV=development
PORT=3000

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 소셜 로그인 설정
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_CALLBACK_URL=http://localhost:3000/api/auth/kakao/callback

NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
NAVER_CALLBACK_URL=http://localhost:3000/api/auth/naver/callback

FRONTEND_URL=http://localhost:3000
```

## 🏗️ 프로젝트 구조

### 도메인 기반 아키텍처 (DDD)

```
src/
├── auth/               # 로그인, 회원가입 등 인증
├── admin/              # 관리자 기능
├── class/              # M클래스 CRUD
├── user/               # 사용자 정보 관리
├── enrollment/         # 신청 관련 도메인 (신청 로직, 내 신청 목록)
├── token/              # JWT 처리 관련
```

### 기술 스택

- **ORM**: Prisma (타입 안전성, 자동 완성)
- **데이터베이스**: PostgreSQL
- **인증**: JWT (Access Token + Refresh Token)
- **에러 처리**: 도메인별 커스텀 에러 클래스
- **API 문서**: Swagger/OpenAPI

## 📚 API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃

#### 소셜 로그인
- `GET /api/auth/google` - Google OAuth 로그인
- `GET /api/auth/google/callback` - Google OAuth 콜백
- `GET /api/auth/kakao` - Kakao OAuth 로그인
- `GET /api/auth/kakao/callback` - Kakao OAuth 콜백
- `GET /api/auth/naver` - Naver OAuth 로그인
- `GET /api/auth/naver/callback` - Naver OAuth 콜백
- `GET /api/auth/social/status` - 소셜 로그인 상태 확인

### 사용자 관리 (User)
- `GET /api/users` - 모든 사용자 조회
- `GET /api/users/:id` - 특정 사용자 조회
- `POST /api/users` - 새 사용자 생성
- `PUT /api/users/:id` - 사용자 정보 수정
- `DELETE /api/users/:id` - 사용자 삭제

### 클래스 관리 (Class)
- `GET /api/classes` - 모든 클래스 조회
- `GET /api/classes/:id` - 특정 클래스 조회
- `POST /api/classes` - 새 클래스 생성
- `PUT /api/classes/:id` - 클래스 정보 수정
- `DELETE /api/classes/:id` - 클래스 삭제

### 수강신청 (Enrollment)
- `GET /api/enrollments` - 내 신청 목록 조회
- `POST /api/enrollments` - 클래스 신청
- `PUT /api/enrollments/:id` - 신청 상태 변경
- `DELETE /api/enrollments/:id` - 신청 취소

### 관리자 (Admin)
- `GET /api/admin/users` - 모든 사용자 관리
- `GET /api/admin/users/:id` - 특정 사용자 상세 정보
- `PUT /api/admin/users/:id` - 사용자 정보 수정
- `DELETE /api/admin/users/:id` - 사용자 삭제
- `GET /api/admin/classes` - 모든 클래스 관리
- `GET /api/admin/classes/:id` - 특정 클래스 상세 정보
- `POST /api/admin/classes` - 새 클래스 생성
- `PUT /api/admin/classes/:id` - 클래스 정보 수정
- `DELETE /api/admin/classes/:id` - 클래스 삭제
- `GET /api/admin/enrollments` - 모든 신청 내역 관리
- `GET /api/admin/enrollments/:id` - 특정 신청 상세 정보
- `PUT /api/admin/enrollments/:id` - 신청 상태 관리
- `DELETE /api/admin/enrollments/:id` - 신청 삭제
- `GET /api/admin/dashboard` - 관리자 대시보드 통계
- `GET /api/admin/logs` - 시스템 로그 조회

## 🐳 Docker 설정

### 개발 환경 (docker-compose.dev.yml)

```yaml
services:
  app:          # Node.js 애플리케이션
  postgres:     # PostgreSQL 데이터베이스
  pgadmin:      # 데이터베이스 관리 도구
```

### 프로덕션 환경 (docker-compose.yml)

```yaml
services:
  app:          # Node.js 애플리케이션
  postgres:     # PostgreSQL 데이터베이스
  prometheus:   # 메트릭 수집
  grafana:      # 대시보드
```

## ☁️ AWS 배포

### ECS 배포

```bash
# AWS 인프라 생성
cd infrastructure
terraform init
terraform apply

# Docker 이미지 빌드 및 푸시
docker build -t mclass-server .
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin [ECR_URL]
docker tag mclass-server:latest [ECR_URL]:latest
docker push [ECR_URL]:latest
```

## 📈 모니터링

### Prometheus 메트릭

- HTTP 요청 수
- 응답 시간
- 에러율
- 데이터베이스 연결 상태

### Grafana 대시보드

- 애플리케이션 성능 지표
- 데이터베이스 성능
- 시스템 리소스 사용량

## 🧪 테스트

```bash
# 단위 테스트
npm test

# 테스트 커버리지
npm run test:coverage

# 통합 테스트
npm run test:integration
```

## 🔧 개발 도구

```bash
# 코드 린팅
npm run lint

# 코드 포맷팅
npm run format

# 타입 체크
npm run build
```

## 🔐 소셜 로그인 설정

### Google OAuth2.0 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI에 `http://localhost:3000/api/auth/google/callback` 추가
4. 환경변수 설정:
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

### Kakao OAuth 설정

1. [Kakao Developers](https://developers.kakao.com/)에서 애플리케이션 생성
2. 플랫폼 설정에서 웹 플랫폼 추가
3. 카카오 로그인 활성화 및 리디렉션 URI 설정
4. 환경변수 설정:
   ```bash
   KAKAO_CLIENT_ID=your-kakao-client-id
   KAKAO_CLIENT_SECRET=your-kakao-client-secret
   ```

### Naver OAuth 설정

1. [Naver Developers](https://developers.naver.com/)에서 애플리케이션 생성
2. 서비스 URL 및 Callback URL 설정
3. 환경변수 설정:
   ```bash
   NAVER_CLIENT_ID=your-naver-client-id
   NAVER_CLIENT_SECRET=your-naver-client-secret
   ```

### 프론트엔드 없이 테스트하기

소셜 로그인은 프론트엔드 없이도 테스트할 수 있습니다:

#### 1. 테스트 엔드포인트 확인
```bash
GET /api/auth/test/social
```

#### 2. 소셜 로그인 시작
브라우저에서 다음 URL로 접속:
- Google: `http://localhost:3000/api/auth/google`
- Kakao: `http://localhost:3000/api/auth/kakao`
- Naver: `http://localhost:3000/api/auth/naver`

#### 3. 소셜 로그인 완료 후
소셜 로그인이 완료되면 서버에서 JSON 응답으로 JWT 토큰을 반환합니다:

```json
{
  "message": "Google 로그인 성공",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "USER",
    "provider": "GOOGLE"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "provider": "google"
}
```

#### 4. 토큰으로 API 테스트
받은 토큰으로 보호된 엔드포인트를 테스트할 수 있습니다:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     http://localhost:3000/api/auth/social/status
```

### 프론트엔드 연동 (선택사항)

프론트엔드가 있는 경우 다음과 같이 연동할 수 있습니다:

```javascript
// URL 파라미터에서 토큰 추출
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('accessToken');
const refreshToken = urlParams.get('refreshToken');
const provider = urlParams.get('provider');

if (accessToken) {
  // 토큰을 로컬 스토리지에 저장
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  // 사용자 정보 가져오기
  fetch('/api/auth/social/status', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
}
```

## 📝 라이센스

ISC License

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request 