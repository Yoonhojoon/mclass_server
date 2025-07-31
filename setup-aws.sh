#!/bin/bash

echo "🚀 AWS 인프라 생성 시작..."

# 1. ECR 리포지토리 생성
echo "📦 ECR 리포지토리 생성 중..."
aws ecr create-repository --repository-name mclass-server --region ap-northeast-2

# 2. IAM 역할 생성
echo "🔐 IAM 역할 생성 중..."
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}' || echo "역할이 이미 존재합니다."

aws iam create-role --role-name ecsTaskRole --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}' || echo "역할이 이미 존재합니다."

# 정책 연결
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy || echo "정책이 이미 연결되어 있습니다."

# 3. ECS 클러스터 생성
echo "🏗️ ECS 클러스터 생성 중..."
aws ecs create-cluster --cluster-name mclass-cluster --region ap-northeast-2

# 4. CloudWatch 로그 그룹 생성
echo "📊 CloudWatch 로그 그룹 생성 중..."
aws logs create-log-group --log-group-name /ecs/mclass-task --region ap-northeast-2

# 5. Task Definition 등록
echo "📋 Task Definition 등록 중..."
aws ecs register-task-definition --cli-input-json file://task-definition.json --region ap-northeast-2

echo "✅ AWS 인프라 생성 완료!"
echo "📝 다음 단계:"
echo "1. GitHub Secrets 설정"
echo "2. 첫 번째 배포 테스트" 