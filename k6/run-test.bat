@echo off
chcp 65001 >nul

REM k6 동시 Enrollment 테스트 실행 스크립트 (Windows)

echo 🚀 k6 동시 Enrollment 테스트 시작
echo ==================================

REM 환경 변수 설정
set BASE_URL=%BASE_URL%
if "%BASE_URL%"=="" set BASE_URL=http://localhost:3000

set MCLASS_ID=%MCLASS_ID%
if "%MCLASS_ID%"=="" set MCLASS_ID=b21c86a0-383a-4d46-9376-fcf246028d13

echo 📍 테스트 대상: %BASE_URL%
echo 🎯 클래스 ID: %MCLASS_ID%
echo.

REM k6 설치 확인
k6 version >nul 2>&1
if errorlevel 1 (
    echo ❌ k6가 설치되지 않았습니다.
    echo 📦 설치 방법:
    echo    Windows: choco install k6
    echo    또는: https://k6.io/docs/getting-started/installation/
    pause
    exit /b 1
)

REM CSV 파일 존재 확인
if not exist "..\artillery\users.csv" (
    echo ❌ users.csv 파일을 찾을 수 없습니다.
    echo 📁 경로: ..\artillery\users.csv
    pause
    exit /b 1
)

echo ✅ k6 설치 확인 완료
echo ✅ CSV 파일 확인 완료
echo.

REM 테스트 실행
echo 🔥 테스트 실행 중...
echo ⏱️  예상 소요 시간: 25초
echo.

k6 run ^
    --env BASE_URL="%BASE_URL%" ^
    --env MCLASS_ID="%MCLASS_ID%" ^
    --out json=k6-results.json ^
    concurrent-enrollment-test.js

echo.
echo 📊 테스트 완료!
echo 📁 결과 파일: k6-results.json
echo.

REM 결과 요약 (간단한 버전)
if exist "k6-results.json" (
    echo 📈 결과 파일이 생성되었습니다.
    echo 📁 k6-results.json 파일을 확인하세요.
) else (
    echo ⚠️ 결과 파일을 찾을 수 없습니다.
)

echo.
echo 🎉 테스트 완료!
pause
