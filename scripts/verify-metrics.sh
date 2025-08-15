#!/bin/bash

# MClass 서버 메트릭 엔드포인트 검증 스크립트
# 사용법: ./scripts/verify-metrics.sh <ALB_DNS_NAME> <METRICS_TOKEN>

set -e

ALB_DNS_NAME=${1:-""}
METRICS_TOKEN=${2:-""}

if [ -z "$ALB_DNS_NAME" ] || [ -z "$METRICS_TOKEN" ]; then
    echo "사용법: $0 <ALB_DNS_NAME> <METRICS_TOKEN>"
    echo "예시: $0 mclass-alb-123456789.ap-northeast-2.elb.amazonaws.com your-token-here"
    exit 1
fi

echo "=== MClass 서버 메트릭 엔드포인트 검증 ==="
echo "ALB DNS: $ALB_DNS_NAME"
echo "토큰: ${METRICS_TOKEN:0:10}..."

# 1. 토큰 없이 접근 시도 (401 또는 403 예상)
echo -e "\n1. 토큰 없이 접근 시도 (401/403 예상):"
curl -i -s "http://$ALB_DNS_NAME:80/metrics" | head -10

# 2. 잘못된 토큰으로 접근 시도 (401 예상)
echo -e "\n2. 잘못된 토큰으로 접근 시도 (401 예상):"
curl -i -s -H "Authorization: Bearer wrong-token" "http://$ALB_DNS_NAME:80/metrics" | head -10

# 3. 올바른 토큰으로 접근 시도 (200 예상)
echo -e "\n3. 올바른 토큰으로 접근 시도 (200 예상):"
RESPONSE=$(curl -i -s -H "Authorization: Bearer $METRICS_TOKEN" "http://$ALB_DNS_NAME:80/metrics")

# HTTP 상태 코드 확인
HTTP_STATUS=$(echo "$RESPONSE" | head -1 | cut -d' ' -f2)
echo "HTTP 상태 코드: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 성공: 메트릭 엔드포인트가 정상적으로 응답합니다."
    
    # 메트릭 내용 일부 출력
    echo -e "\n메트릭 내용 (처음 10줄):"
    echo "$RESPONSE" | tail -n +2 | head -10
    
    # 주요 메트릭 확인
    echo -e "\n주요 메트릭 확인:"
    echo "$RESPONSE" | grep -E "(mclass_process_cpu|mclass_process_resident_memory|http_requests_total)" | head -5
    
else
    echo "❌ 실패: HTTP 상태 코드 $HTTP_STATUS"
    echo "응답 내용:"
    echo "$RESPONSE" | head -10
fi

# 4. 헬스체크 엔드포인트 확인
echo -e "\n4. 헬스체크 엔드포인트 확인:"
HEALTH_RESPONSE=$(curl -i -s "http://$ALB_DNS_NAME:80/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | head -1 | cut -d' ' -f2)
echo "헬스체크 상태 코드: $HEALTH_STATUS"

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ 헬스체크 정상"
else
    echo "❌ 헬스체크 실패"
fi

echo -e "\n=== 검증 완료 ==="
