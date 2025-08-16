#!/bin/bash

# Artillery 부하 테스트 실행 스크립트

echo "🚀 Artillery 부하 테스트 시작"
echo "================================"

# 결과 디렉토리 생성
mkdir -p results

# 현재 시간을 파일명에 포함
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "📊 1. 동시 신청 부하 테스트 실행 중..."
artillery run --output results/load-test-${TIMESTAMP}.json load-test.yml

echo "📊 2. 멱등성 테스트 실행 중..."
artillery run --output results/idempotency-test-${TIMESTAMP}.json idempotency-test.yml

echo "📊 3. HTML 리포트 생성 중..."
artillery report results/load-test-${TIMESTAMP}.json --output results/load-test-report-${TIMESTAMP}.html
artillery report results/idempotency-test-${TIMESTAMP}.json --output results/idempotency-test-report-${TIMESTAMP}.html

echo "✅ 테스트 완료!"
echo "📁 결과 파일 위치:"
echo "   - JSON: results/load-test-${TIMESTAMP}.json"
echo "   - HTML: results/load-test-report-${TIMESTAMP}.html"
echo "   - 멱등성 JSON: results/idempotency-test-${TIMESTAMP}.json"
echo "   - 멱등성 HTML: results/idempotency-test-report-${TIMESTAMP}.html"

# 브라우저에서 리포트 열기 (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open results/load-test-report-${TIMESTAMP}.html
    open results/idempotency-test-report-${TIMESTAMP}.html
fi

