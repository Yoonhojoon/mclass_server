#!/bin/bash

# k6 동시 Enrollment 테스트 실행 스크립트

echo "🚀 k6 동시 Enrollment 테스트 시작"
echo "=================================="

# 환경 변수 설정
export BASE_URL=${BASE_URL:-"http://localhost:3000"}
export MCLASS_ID=${MCLASS_ID:-"b21c86a0-383a-4d46-9376-fcf246028d13"}

echo "📍 테스트 대상: $BASE_URL"
echo "🎯 클래스 ID: $MCLASS_ID"
echo ""

# k6 설치 확인
if ! command -v k6 &> /dev/null; then
    echo "❌ k6가 설치되지 않았습니다."
    echo "📦 설치 방법:"
    echo "   macOS: brew install k6"
    echo "   Ubuntu: sudo apt-get install k6"
    echo "   Windows: choco install k6"
    echo "   또는: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# CSV 파일 존재 확인
if [ ! -f "../artillery/users.csv" ]; then
    echo "❌ users.csv 파일을 찾을 수 없습니다."
    echo "📁 경로: ../artillery/users.csv"
    exit 1
fi

echo "✅ k6 설치 확인 완료"
echo "✅ CSV 파일 확인 완료"
echo ""

# 테스트 실행
echo "🔥 테스트 실행 중..."
echo "⏱️  예상 소요 시간: 25초"
echo ""

k6 run \
    --env BASE_URL="$BASE_URL" \
    --env MCLASS_ID="$MCLASS_ID" \
    --out json=k6-results.json \
    --out influxdb=http://localhost:8086/k6 \
    concurrent-enrollment-test.js

echo ""
echo "📊 테스트 완료!"
echo "📁 결과 파일: k6-results.json"
echo ""

# 결과 요약
if [ -f "k6-results.json" ]; then
    echo "📈 결과 요약:"
    echo "=============="
    
    # JSON 결과에서 주요 지표 추출
    TOTAL_REQUESTS=$(jq -r '.metrics.http_reqs.values.count' k6-results.json 2>/dev/null || echo "N/A")
    ERROR_RATE=$(jq -r '.metrics.http_req_failed.values.rate' k6-results.json 2>/dev/null || echo "N/A")
    AVG_RESPONSE_TIME=$(jq -r '.metrics.http_req_duration.values.avg' k6-results.json 2>/dev/null || echo "N/A")
    P95_RESPONSE_TIME=$(jq -r '.metrics.http_req_duration.values."p(95)"' k6-results.json 2>/dev/null || echo "N/A")
    
    echo "총 요청 수: $TOTAL_REQUESTS"
    echo "에러율: $ERROR_RATE"
    echo "평균 응답 시간: ${AVG_RESPONSE_TIME}ms"
    echo "P95 응답 시간: ${P95_RESPONSE_TIME}ms"
else
    echo "⚠️ 결과 파일을 찾을 수 없습니다."
fi

echo ""
echo "🎉 테스트 완료!"
