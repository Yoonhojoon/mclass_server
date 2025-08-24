@echo off
echo ========================================
echo 수강 신청 전용 k6 테스트 실행 스크립트
echo ========================================

REM 환경 변수 설정
set BASE_URL=http://mclass-alb-616483239.ap-northeast-2.elb.amazonaws.com
set MCLASS_ID=6390cd1c-6514-4a19-9224-0d89c17a54d3

REM 명령행 인수 처리
if "%1" neq "" (
    set BASE_URL=%1
    echo 대상 URL: %BASE_URL%
)

echo.
echo 테스트 설정:
echo - 대상 URL: %BASE_URL%
echo - MClass ID: %MCLASS_ID%
echo - 사용자 데이터: artillery/artillery/users.csv
echo - 테스트 파일: enrollment-only-test.js
echo.

REM k6 설치 확인
k6 version >nul 2>&1
if errorlevel 1 (
    echo ❌ k6가 설치되지 않았습니다.
    echo https://k6.io/docs/getting-started/installation/ 에서 설치하세요.
    pause
    exit /b 1
)

echo ✅ k6 설치 확인됨
echo.

REM CSV 파일 존재 확인
if not exist "..\artillery\artillery\users.csv" (
    echo ❌ users.csv 파일을 찾을 수 없습니다.
    echo artillery/artillery/users.csv 파일이 존재하는지 확인하세요.
    pause
    exit /b 1
)

echo ✅ users.csv 파일 확인됨
echo.

REM 서버 연결 테스트
echo 🔍 서버 연결 테스트 중...
curl -s -o nul -w "%%{http_code}" "%BASE_URL%/health" > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt

if "%STATUS%"=="200" (
    echo ✅ 서버 연결 성공 (상태 코드: %STATUS%)
) else (
    echo ⚠️ 서버 연결 상태: %STATUS% (테스트는 계속 진행됩니다)
)
echo.

REM 테스트 실행
echo ========================================
echo 수강 신청 전용 테스트 시작
echo ========================================
echo.

k6 run --env BASE_URL=%BASE_URL% enrollment-only-test.js

echo.
echo ========================================
echo 테스트 완료
echo ========================================
echo.

pause
