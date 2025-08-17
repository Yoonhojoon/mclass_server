# Artillery 부하 테스트

## 📁 파일 구조

### 기존 테스트
- `load-test.yml` - 전체 사용자 생성부터 enrollment까지의 통합 테스트
- `load-test-processor.mjs` - 기존 테스트용 프로세서

### 새로운 동시 테스트
- `concurrent-enrollment-test.yml` - **동시 enrollment 신청 테스트**
- `concurrent-enrollment-processor.mjs` - 동시 테스트용 프로세서
- `generate-users.mjs` - 사용자 생성 스크립트
- `run-concurrent-test.ps1` - 동시 테스트 실행 스크립트

## 🚀 동시 Enrollment 테스트 실행

### 방법 1: PowerShell 스크립트 사용 (권장)
```powershell
# 기본 200명으로 테스트
.\artillery\run-concurrent-test.ps1

# 사용자 수 지정
.\artillery\run-concurrent-test.ps1 -UserCount 300
```

### 방법 2: 수동 실행
```bash
# 1. 사용자 생성
node artillery/generate-users.mjs 200

# 2. 동시 enrollment 테스트 실행
npx artillery run artillery/concurrent-enrollment-test.yml --record --key YOUR_KEY
```

## 📊 테스트 시나리오

### 동시 Enrollment 테스트
1. **사용자 생성**: 200명의 사용자를 미리 생성하고 CSV에 저장
2. **동시 신청**: 모든 사용자가 동시에 enrollment 신청
3. **부하 시뮬레이션**: 20 RPS로 10초간 피크 부하

### 장점
- ✅ **현실적인 시나리오**: 실제 사용자들이 동시에 신청하는 상황
- ✅ **빠른 실행**: 사용자 생성은 미리 완료되어 테스트 시간 단축
- ✅ **정확한 동시성**: 모든 사용자가 동시에 enrollment 신청
- ✅ **데이터 정합성**: 각 사용자별 고유한 토큰과 답변

## 🔧 설정 옵션

### 사용자 수 조정
```powershell
.\artillery\run-concurrent-test.ps1 -UserCount 500
```

### Artillery Cloud 키 변경
```powershell
.\artillery\run-concurrent-test.ps1 -RecordKey "your_new_key"
```

## 📈 예상 결과

- **동시 사용자**: 200명
- **피크 RPS**: 20 requests/second
- **테스트 시간**: 약 20초
- **목표**: enrollment 신청의 동시성 처리 능력 측정

## 🐛 문제 해결

### CSV 파일 문제
```bash
# CSV 파일 재생성
node artillery/generate-users.mjs 200
```

### 토큰 만료
```bash
# 사용자 재생성 (새 토큰 발급)
node artillery/generate-users.mjs 200
```

### 데이터베이스 연결 문제
```bash
# Prisma 클라이언트 재생성
npx prisma generate
```

