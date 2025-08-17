# k6 동시 Enrollment 테스트

Artillery 테스트와 동일한 동시 신청 테스트를 k6로 구현한 버전입니다.

## 📋 개요

이 테스트는 다음과 같은 시나리오를 검증합니다:

1. **클래스 조회** - MClass 정보 조회
2. **신청서 양식 조회** - Enrollment Form 조회
3. **동적 답변 생성** - 신청서 질문에 따른 답변 생성
4. **클래스 신청** - 실제 Enrollment 생성 (멱등성 키 포함)

## 🚀 실행 방법

### 1. k6 설치

```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo apt-get install k6

# Windows
choco install k6

# 또는 공식 사이트에서 다운로드
# https://k6.io/docs/getting-started/installation/
```

### 2. 직접 실행

```bash
# 기본 설정으로 실행
k6 run concurrent-enrollment-test.js

# 환경 변수로 설정 변경
BASE_URL=https://your-api.com MCLASS_ID=your-class-id k6 run concurrent-enrollment-test.js

# 결과를 JSON 파일로 저장
k6 run --out json=results.json concurrent-enrollment-test.js
```

### 3. 스크립트 실행

#### Linux/macOS
```bash
chmod +x run-test.sh
./run-test.sh
```

#### Windows
```cmd
run-test.bat
```

## ⚙️ 설정

### 환경 변수

- `BASE_URL`: 테스트 대상 서버 URL (기본값: `http://localhost:3000`)
- `MCLASS_ID`: 테스트할 클래스 ID (기본값: `b21c86a0-383a-4d46-9376-fcf246028d13`)

### 테스트 단계

```javascript
stages: [
  { duration: '5s', target: 1 },    // Warm up
  { duration: '12s', target: 12 },  // Peak 12 rps - 동시 신청
  { duration: '8s', target: 6 },    // Sustain 6 rps
]
```

### 성능 임계값

```javascript
thresholds: {
  http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  http_req_failed: ['rate<0.1'],    // error rate must be less than 10%
  'enrollment_response_time': ['p(95)<300'], // 신청 응답 시간
  'mclass_response_time': ['p(95)<100'],     // 클래스 조회 응답 시간
  'form_response_time': ['p(95)<100'],       // 신청서 조회 응답 시간
}
```

## 📊 메트릭

### 커스텀 메트릭

- `enrollment_response_time`: 신청 API 응답 시간
- `mclass_response_time`: 클래스 조회 API 응답 시간
- `form_response_time`: 신청서 양식 조회 API 응답 시간
- `errors`: 에러 발생률

### 기본 메트릭

- `http_reqs`: 총 HTTP 요청 수
- `http_req_duration`: HTTP 요청 응답 시간
- `http_req_failed`: HTTP 요청 실패율
- `vus`: 가상 사용자 수
- `iterations`: 반복 횟수

## 🔍 검증 항목

### 성공 케이스 (201)
- 신청 ID 존재
- 클래스 ID 일치
- 상태값 유효 (APPLIED, APPROVED, WAITLISTED)

### 중복 신청 케이스 (409)
- 멱등성 키로 인한 정상적인 중복 처리

### 응답 시간 검증
- 클래스 조회: < 100ms
- 신청서 양식 조회: < 100ms
- 신청 생성: < 500ms

## 📁 파일 구조

```
k6/
├── concurrent-enrollment-test.js  # 메인 테스트 파일
├── run-test.sh                   # Linux/macOS 실행 스크립트
├── run-test.bat                  # Windows 실행 스크립트
└── README.md                     # 이 파일
```

## 🆚 Artillery vs k6 비교

| 기능 | Artillery | k6 |
|------|-----------|----|
| 언어 | YAML + JavaScript | JavaScript |
| 성능 | 중간 | 높음 |
| 메트릭 | 기본 제공 | 커스텀 가능 |
| 확장성 | 제한적 | 높음 |
| 학습 곡선 | 낮음 | 중간 |
| 실시간 모니터링 | 제한적 | 풍부 |

## 🐛 문제 해결

### k6 설치 오류
```bash
# 버전 확인
k6 version

# 설치 재시도
# https://k6.io/docs/getting-started/installation/
```

### CSV 파일 오류
```bash
# 파일 경로 확인
ls -la ../artillery/users.csv

# 파일 내용 확인
head -5 ../artillery/users.csv
```

### 네트워크 오류
```bash
# 서버 상태 확인
curl http://localhost:3000/health

# 포트 확인
netstat -an | grep 3000
```

## 📈 결과 분석

테스트 완료 후 `k6-results.json` 파일에서 다음 정보를 확인할 수 있습니다:

- 총 요청 수 및 성공/실패 비율
- 응답 시간 분포 (평균, P95, P99)
- 에러율 및 에러 유형
- 커스텀 메트릭 데이터

## 🔗 관련 링크

- [k6 공식 문서](https://k6.io/docs/)
- [k6 JavaScript API](https://k6.io/docs/javascript-api/)
- [k6 메트릭 가이드](https://k6.io/docs/using-k6/metrics/)
- [Artillery 테스트](../artillery/)
