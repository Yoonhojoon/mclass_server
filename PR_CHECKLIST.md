# Dockerfile & start.sh 리팩터링 PR 체크리스트

## 🎯 목표
운영 안전성/보안/재현성 기준으로 Dockerfile과 start.sh를 리팩터링하고, Prisma 마이그레이션 실패(P3009/P3018) 공식 절차로 복구

## ✅ 변경사항 요약

### 1. start.sh 리팩터링
- [x] `_prisma_migrations` 직접 삭제 로직 제거
- [x] URL 형식 검증(비번 마스킹) 추가
- [x] `prisma migrate deploy` 백오프 재시도 로직 구현
- [x] 구조화된 로깅 시스템 추가
- [x] 데이터베이스 연결 확인 로직 추가

### 2. Dockerfile 리팩터링
- [x] 빌드 타임 `npx prisma generate`로 전환
- [x] production 단계에 `@prisma`와 `.prisma` 폴더 복사
- [x] 런타임 `npx prisma generate` 삭제
- [x] start.sh 파일을 별도 파일로 분리

### 3. GitHub Actions/Terraform 파이프라인 개선
- [x] DATABASE_URL 개행/공백 제거 로직 추가
- [x] 환경변수 형식 검증 강화
- [x] 마스킹된 로그 출력 개선

### 4. P3009/P3018 처리 문서화
- [x] 복구 절차 문서화 (`docs/PRISMA_MIGRATION_RECOVERY.md`)
- [x] 자동화된 복구 방법 제시
- [x] 예방 조치 가이드 작성

## 🔍 배포 후 검증 체크리스트

### 컨테이너 기동 로그 검증
- [ ] 컨테이너 기동 로그에 마스킹된 DBURL만 노출
  ```bash
  # 예상 로그 형식
  [2024-12-XX XX:XX:XX] ℹ️  DATABASE_URL: postgresql://username:*****@host:port/database
  ```

### Prisma 마이그레이션 검증
- [ ] `migrate deploy` 성공
  ```bash
  [2024-12-XX XX:XX:XX] ✅ 마이그레이션 완료
  ```

- [ ] `migrate status` Up to date
  ```bash
  [2024-12-XX XX:XX:XX] ✅ 마이그레이션 상태: Up to date
  ```

### 런타임 검증
- [ ] 런타임 generate 미사용 확인
  ```bash
  # 로그에서 "Prisma 클라이언트 재생성" 메시지가 없어야 함
  ```

### 보안 검증
- [ ] 민감한 정보가 로그에 노출되지 않음
- [ ] DATABASE_URL 비밀번호가 마스킹되어 출력됨
- [ ] 환경변수 형식 검증이 정상 작동

### 성능 검증
- [ ] 컨테이너 시작 시간 개선 (빌드 타임 generate로 인한)
- [ ] 마이그레이션 재시도 로직이 정상 작동
- [ ] 데이터베이스 연결 확인이 효율적으로 작동

## 🚨 문제 발생 시 대응

### P3009/P3018 오류 발생 시
1. **즉시 대응**
   ```bash
   # 실패한 마이그레이션 해결
   npx prisma migrate resolve --rolled-back 20250811065406_make_recruit_dates_required
   ```

2. **스키마 정합화**
   ```bash
   # 새 마이그레이션 생성
   npx prisma migrate dev --name fix_schema_consistency
   ```

3. **재배포**
   ```bash
   # main 브랜치에 푸시하여 자동 배포
   git push origin main
   ```

### 컨테이너 시작 실패 시
1. **로그 확인**
   ```bash
   # ECS 태스크 로그 확인
   aws logs get-log-events --log-group-name /ecs/mclass-server --log-stream-name <stream-name>
   ```

2. **환경변수 검증**
   ```bash
   # SSM Parameter Store에서 환경변수 확인
   aws ssm get-parameter --name /mclass/DATABASE_URL --with-decryption
   ```

## 📋 테스트 시나리오

### 정상 시나리오
1. **새로운 배포**
   - main 브랜치에 푸시
   - GitHub Actions 자동 실행
   - ECS 서비스 업데이트
   - 컨테이너 정상 시작

2. **마이그레이션 성공**
   - `prisma migrate deploy` 성공
   - `prisma migrate status` Up to date
   - 애플리케이션 정상 시작

### 오류 시나리오
1. **데이터베이스 연결 실패**
   - 재시도 로직 작동 확인
   - 적절한 오류 메시지 출력

2. **마이그레이션 실패**
   - 백오프 재시도 로직 작동
   - P3009/P3018 오류 메시지 출력
   - 복구 절차 안내

## 🔧 추가 개선 사항

### 모니터링 강화
- [ ] CloudWatch 로그 필터링 설정
- [ ] 마이그레이션 실패 알림 설정
- [ ] 컨테이너 시작 시간 모니터링

### 문서화 개선
- [ ] 운영 가이드 업데이트
- [ ] 트러블슈팅 가이드 작성
- [ ] 팀 교육 자료 준비

### 자동화 개선
- [ ] 마이그레이션 상태 자동 확인
- [ ] 실패 시 자동 복구 스크립트
- [ ] 헬스체크 엔드포인트 개선

## 📞 연락처

- **DevOps 담당자**: devops@company.com
- **긴급 상황**: #devops-alerts Slack 채널
- **문서 관리**: Confluence - DevOps 가이드

---

**PR 승인 조건**: 모든 체크리스트 항목이 ✅ 상태여야 함
