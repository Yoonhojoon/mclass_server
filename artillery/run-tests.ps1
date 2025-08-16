# Artillery 부하 테스트 실행 스크립트 (PowerShell)

Write-Host "🚀 Artillery 부하 테스트 시작" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# 결과 디렉토리 생성
if (!(Test-Path "results")) {
    New-Item -ItemType Directory -Path "results"
}

# 현재 시간을 파일명에 포함
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "📊 1. 동시 신청 부하 테스트 실행 중..." -ForegroundColor Yellow
artillery run --output "results/load-test-$TIMESTAMP.json" load-test.yml

Write-Host "📊 2. 멱등성 테스트 실행 중..." -ForegroundColor Yellow
artillery run --output "results/idempotency-test-$TIMESTAMP.json" idempotency-test.yml

Write-Host "📊 3. HTML 리포트 생성 중..." -ForegroundColor Yellow
artillery report "results/load-test-$TIMESTAMP.json" --output "results/load-test-report-$TIMESTAMP.html"
artillery report "results/idempotency-test-$TIMESTAMP.json" --output "results/idempotency-test-report-$TIMESTAMP.html"

Write-Host "✅ 테스트 완료!" -ForegroundColor Green
Write-Host "📁 결과 파일 위치:" -ForegroundColor Cyan
Write-Host "   - JSON: results/load-test-$TIMESTAMP.json" -ForegroundColor White
Write-Host "   - HTML: results/load-test-report-$TIMESTAMP.html" -ForegroundColor White
Write-Host "   - 멱등성 JSON: results/idempotency-test-$TIMESTAMP.json" -ForegroundColor White
Write-Host "   - 멱등성 HTML: results/idempotency-test-report-$TIMESTAMP.html" -ForegroundColor White

# 브라우저에서 리포트 열기
Write-Host "🌐 브라우저에서 리포트 열기..." -ForegroundColor Yellow
Start-Process "results/load-test-report-$TIMESTAMP.html"
Start-Process "results/idempotency-test-report-$TIMESTAMP.html"
