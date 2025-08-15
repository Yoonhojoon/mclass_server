# MClass 서버 메트릭 엔드포인트 검증 스크립트 (PowerShell)
# 사용법: .\scripts\verify-metrics.ps1 -AlbDnsName <ALB_DNS_NAME> -MetricsToken <METRICS_TOKEN>

param(
    [Parameter(Mandatory=$true)]
    [string]$AlbDnsName,
    
    [Parameter(Mandatory=$true)]
    [string]$MetricsToken
)

# 오류 발생 시 중단
$ErrorActionPreference = "Stop"

Write-Host "=== MClass 서버 메트릭 엔드포인트 검증 ===" -ForegroundColor Cyan
Write-Host "ALB DNS: $AlbDnsName" -ForegroundColor Yellow
Write-Host "토큰: $($MetricsToken.Substring(0, [Math]::Min(10, $MetricsToken.Length)))..." -ForegroundColor Yellow

# 1. 토큰 없이 접근 시도 (401 또는 403 예상)
Write-Host "`n1. 토큰 없이 접근 시도 (401/403 예상):" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://$AlbDnsName`:80/metrics" -Method GET -UseBasicParsing
    Write-Host "HTTP 상태 코드: $($response.StatusCode)" -ForegroundColor Red
    Write-Host "❌ 예상과 다름: 토큰 없이도 접근 가능" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP 상태 코드: $statusCode" -ForegroundColor Green
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "✅ 예상대로 차단됨" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 예상과 다른 상태 코드" -ForegroundColor Yellow
    }
}

# 2. 잘못된 토큰으로 접근 시도 (401 예상)
Write-Host "`n2. 잘못된 토큰으로 접근 시도 (401 예상):" -ForegroundColor Green
try {
    $headers = @{
        "Authorization" = "Bearer wrong-token"
    }
    $response = Invoke-WebRequest -Uri "http://$AlbDnsName`:80/metrics" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "HTTP 상태 코드: $($response.StatusCode)" -ForegroundColor Red
    Write-Host "❌ 예상과 다름: 잘못된 토큰으로도 접근 가능" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP 상태 코드: $statusCode" -ForegroundColor Green
    if ($statusCode -eq 401) {
        Write-Host "✅ 예상대로 인증 실패" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 예상과 다른 상태 코드" -ForegroundColor Yellow
    }
}

# 3. 올바른 토큰으로 접근 시도 (200 예상)
Write-Host "`n3. 올바른 토큰으로 접근 시도 (200 예상):" -ForegroundColor Green
try {
    $headers = @{
        "Authorization" = "Bearer $MetricsToken"
    }
    $response = Invoke-WebRequest -Uri "http://$AlbDnsName`:80/metrics" -Method GET -Headers $headers -UseBasicParsing
    
    Write-Host "HTTP 상태 코드: $($response.StatusCode)" -ForegroundColor Green
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 성공: 메트릭 엔드포인트가 정상적으로 응답합니다." -ForegroundColor Green
        
        # 메트릭 내용 일부 출력
        Write-Host "`n메트릭 내용 (처음 10줄):" -ForegroundColor Cyan
        $lines = $response.Content -split "`n" | Select-Object -First 10
        $lines | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
        
        # 주요 메트릭 확인
        Write-Host "`n주요 메트릭 확인:" -ForegroundColor Cyan
        $metrics = $response.Content -split "`n" | Where-Object { 
            $_ -match "(mclass_process_cpu|mclass_process_resident_memory|http_requests_total)" 
        } | Select-Object -First 5
        $metrics | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
        
    } else {
        Write-Host "❌ 실패: HTTP 상태 코드 $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ 실패: HTTP 상태 코드 $statusCode" -ForegroundColor Red
    Write-Host "오류: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. 헬스체크 엔드포인트 확인
Write-Host "`n4. 헬스체크 엔드포인트 확인:" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://$AlbDnsName`:80/health" -Method GET -UseBasicParsing
    Write-Host "헬스체크 상태 코드: $($response.StatusCode)" -ForegroundColor Green
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 헬스체크 정상" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 헬스체크 상태 이상" -ForegroundColor Yellow
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "헬스체크 상태 코드: $statusCode" -ForegroundColor Red
    Write-Host "❌ 헬스체크 실패" -ForegroundColor Red
}

Write-Host "`n=== 검증 완료 ===" -ForegroundColor Cyan
