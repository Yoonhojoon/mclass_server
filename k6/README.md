# k6 로드 테스트 가이드

이 디렉토리에는 `users.csv` 파일의 데이터를 사용한 k6 로드 테스트 스크립트들이 포함되어 있습니다.

## 📁 파일 구조

```
k6/
├── load-test-with-users.js      # 기본 로드 테스트
├── advanced-load-test.js        # 고급 로드 테스트 (수강 신청 포함)
├── enrollment-only-test.js      # 수강 신청 전용 테스트
├── concurrent-enrollment-test.js # 기존 동시 신청 테스트
├── run-enrollment-test.bat     # 수강 신청 전용 실행 스크립트
├── run-load-test.bat           # Windows 실행 스크립트
├── run-test.bat                # 기존 실행 스크립트
├── run-test.sh                 # Linux/Mac 실행 스크립트
└── README.md                   # 이 파일
```

## 🚀 빠른 시작

### Windows에서 실행

```bash
# 기본 로드 테스트
k6/run-load-test.bat

# 고급 로드 테스트
k6/run-load-test.bat advanced

# 수강 신청 전용 테스트
k6/run-enrollment-test.bat

# 다른 URL로 테스트
k6/run-load-test.bat basic http://your-server:3000
k6/run-enrollment-test.bat http://your-server:3000
```

### 직접 실행

```bash
# 기본 테스트
k6 run --env BASE_URL=http://localhost:3000 k6/load-test-with-users.js

# 고급 테스트
k6 run --env BASE_URL=http://localhost:3000 k6/advanced-load-test.js

# 수강 신청 전용 테스트
k6 run --env BASE_URL=http://localhost:3000 k6/enrollment-only-test.js
```

## 📊 테스트 종류

### 1. 기본 로드 테스트 (`load-test-with-users.js`)

**특징:**
- 200명의 사용자 데이터 사용
- 읽기 전용 API 테스트
- 부하 단계: 5 → 20 → 20 → 0 (총 2분)

**테스트 API:**
- 사용자 프로필 조회
- MClass 목록 조회
- 수강 신청서 목록 조회
- 수강 신청 목록 조회
- 토큰 갱신 (10% 확률)

### 2. 고급 로드 테스트 (`advanced-load-test.js`)

**특징:**
- 수강 신청 시나리오 포함
- 실제 사용자 플로우 시뮬레이션
- 부하 단계: 10 → 30 → 30 → 0 (총 3분)

**테스트 API:**
- MClass 목록 조회
- 수강 신청서 조회
- 수강 신청 (30% 확률)
- 내 신청 목록 조회
- 사용자 프로필 조회

### 3. 수강 신청 전용 테스트 (`enrollment-only-test.js`)

**특징:**
- 특정 MClass에 대한 수강 신청만 테스트
- 고정된 MClass ID 사용: `6390cd1c-6514-4a19-9224-0d89c17a54d3`
- 부하 단계: 5 → 15 → 15 → 0 (총 2분)

**테스트 API:**
- MClass 상세 정보 조회
- 수강 신청서 조회
- 수강 신청 (100% 확률)
- 내 신청 목록 조회 (확인용)

## 📈 성능 기준

### 기본 테스트 기준
- **응답 시간**: 95% 요청이 1초 이내
- **에러율**: 5% 미만
- **개별 API 기준**:
  - 인증: 500ms 이내
  - 프로필: 300ms 이내
  - 신청: 800ms 이내
  - MClass: 200ms 이내

### 고급 테스트 기준
- **응답 시간**: 95% 요청이 1.5초 이내
- **에러율**: 3% 미만
- **수강 신청 성공율**: 95% 이상
- **개별 API 기준**:
  - MClass: 300ms 이내
  - 신청: 1000ms 이내
  - 신청서: 400ms 이내

### 수강 신청 전용 테스트 기준
- **응답 시간**: 95% 요청이 2초 이내
- **에러율**: 5% 미만
- **수강 신청 성공율**: 90% 이상
- **개별 API 기준**:
  - MClass: 300ms 이내
  - 신청: 1500ms 이내
  - 신청서: 500ms 이내

## 🔧 설정 옵션

### 환경 변수

```bash
# 기본 URL 설정
BASE_URL=http://localhost:3000

# 다른 서버로 테스트
BASE_URL=https://your-production-server.com
```

### 테스트 단계 조정

각 테스트 파일의 `options.stages`를 수정하여 부하 패턴을 조정할 수 있습니다:

```javascript
export const options = {
  stages: [
    { duration: '10s', target: 5 },    // 워밍업
    { duration: '30s', target: 20 },   // 부하 증가
    { duration: '60s', target: 20 },   // 지속 부하
    { duration: '20s', target: 0 },    // 점진적 감소
  ],
  // ...
};
```

## 📋 사용자 데이터

테스트는 `artillery/artillery/users.csv` 파일의 200명 사용자 데이터를 사용합니다:

```csv
email,password,accessToken
user1@test.com,password123,eyJhbGciOiJIUzI1NiIs...
user2@test.com,password123,eyJhbGciOiJIUzI1NiIs...
...
```

## 📊 결과 해석

### 성공적인 테스트 결과

```
✓ http_req_duration..............: avg=245.12ms min=45.12ms med=180.23ms max=890.45ms p(95)=456.78ms
✓ http_req_failed...............: 0.00% ✓ 0.00% ✗ 0.00%
✓ enrollment_success............: 100.00% ✓ 15 ✗ 0
```

### 실패한 테스트 결과

```
✗ http_req_duration..............: avg=1200.45ms min=200.12ms med=890.23ms max=3000.45ms p(95)=2500.78ms
✗ http_req_failed...............: 15.00% ✓ 85 ✗ 15
```

## 🛠️ 문제 해결

### k6 설치

```bash
# Windows (Chocolatey)
choco install k6

# Windows (Scoop)
scoop install k6

# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 일반적인 문제

1. **CSV 파일 경로 오류**
   - `artillery/artillery/users.csv` 파일이 존재하는지 확인
   - 상대 경로가 올바른지 확인

2. **서버 연결 실패**
   - 대상 서버가 실행 중인지 확인
   - URL과 포트가 올바른지 확인

3. **토큰 만료**
   - `users.csv`의 토큰이 유효한지 확인
   - 필요시 새로운 토큰으로 업데이트

## 📝 로그 분석

테스트 실행 중 다음과 같은 로그를 확인할 수 있습니다:

```
✅ 수강 신청 성공: user1@test.com -> class-id-123
ℹ️ 이미 신청된 클래스: user2@test.com -> class-id-123
❌ 프로필 조회 실패: 401 - user3@test.com
```

## 🔄 지속적인 모니터링

프로덕션 환경에서는 정기적으로 로드 테스트를 실행하여 성능을 모니터링하는 것을 권장합니다:

```bash
# 매일 밤 2시에 테스트 실행 (cron 예시)
0 2 * * * cd /path/to/project && k6 run --env BASE_URL=https://your-server.com k6/load-test-with-users.js
```
