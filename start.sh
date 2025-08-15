#!/bin/sh
set -e

# 로깅 함수 정의
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️  $1"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1"
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1"
}

# DATABASE_URL 마스킹 함수
mask_database_url() {
    local url="$1"
    if [ -z "$url" ]; then
        echo "DATABASE_URL이 설정되지 않음"
        return
    fi
    
    # postgresql://username:password@host:port/database 형식에서 비밀번호만 마스킹
    echo "$url" | sed 's/\(postgresql:\/\/[^:]*:\)[^@]*\(@.*\)/\1*****\2/'
}

# 환경 변수 검증
log_info "환경 변수 확인 중..."
log_info "NODE_ENV: $NODE_ENV"
log_info "DATABASE_URL: $(mask_database_url "$DATABASE_URL")"

# DATABASE_URL 형식 검증
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL이 설정되지 않았습니다"
    exit 1
fi

if ! echo "$DATABASE_URL" | grep -q "^postgresql://"; then
    log_error "DATABASE_URL이 올바른 PostgreSQL 형식이 아닙니다"
    exit 1
fi

log_success "환경 변수 검증 완료"

# 데이터베이스 연결 확인
log_info "데이터베이스 연결 확인 중..."
max_retries=5
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    if pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; then
        log_success "데이터베이스 연결 성공"
        break
    else
        retry_count=$((retry_count + 1))
        log_warning "데이터베이스 연결 실패 (시도 $retry_count/$max_retries)"
        if [ $retry_count -lt $max_retries ]; then
            sleep 5
        fi
    fi
done

if [ $retry_count -eq $max_retries ]; then
    log_error "데이터베이스 연결 실패 - 최대 재시도 횟수 초과"
    exit 1
fi

# Prisma 마이그레이션 실행 (백오프 재시도 + 공식 명령어 자동 처리)
log_info "Prisma 마이그레이션 시작..."

# 강제 마이그레이션 리셋 실행 (임시)
log_warning "임시로 마이그레이션 리셋 실행 중..."
if npx prisma migrate reset --force; then
    log_success "마이그레이션 리셋 완료"
else
    log_error "마이그레이션 리셋 실패"
    exit 1
fi

max_migration_retries=3
migration_retry_count=0

while [ $migration_retry_count -lt $max_migration_retries ]; do
    if npx prisma migrate deploy; then
        log_success "마이그레이션 완료"
        break
    else
        migration_retry_count=$((migration_retry_count + 1))
        log_warning "마이그레이션 실패 (시도 $migration_retry_count/$max_migration_retries)"
        
        # P3009/P3018 오류 자동 처리
        if [ $migration_retry_count -eq 1 ]; then
            log_info "P3009/P3018 오류 자동 복구 시도 중..."
            
            # 실패한 마이그레이션 동적 감지 및 해결
            log_info "실패한 마이그레이션 확인 중..."
            
            # 마이그레이션 상태에서 실패한 것들 찾기
            FAILED_MIGRATIONS=$(npx prisma migrate status 2>&1 | grep -E "failed|Failed" | grep -oE "[0-9]{14}_[a-zA-Z_]+" || echo "")
            
            if [ -n "$FAILED_MIGRATIONS" ]; then
                log_info "실패한 마이그레이션 발견: $FAILED_MIGRATIONS"
                for migration in $FAILED_MIGRATIONS; do
                    log_info "마이그레이션 $migration 해결 시도 중..."
                    if npx prisma migrate resolve --rolled-back "$migration" 2>/dev/null; then
                        log_success "마이그레이션 $migration 해결 완료"
                    else
                        log_warning "마이그레이션 $migration 해결 실패 (이미 해결되었거나 존재하지 않음)"
                    fi
                done
            else
                log_info "실패한 마이그레이션이 감지되지 않음 - 수동 해결 필요"
            fi
            
            log_info "마이그레이션 재시도 중..."
            continue
        fi
        
        if [ $migration_retry_count -lt $max_migration_retries ]; then
            log_info "5초 후 재시도..."
            sleep 5
        fi
    fi
done

if [ $migration_retry_count -eq $max_migration_retries ]; then
    log_error "마이그레이션 실패 - 최대 재시도 횟수 초과"
    log_error "P3009/P3018 오류가 발생한 경우 다음 절차를 따르세요:"
    log_error "1. npx prisma migrate resolve --rolled-back 20250811065406_make_recruit_dates_required"
    log_error "2. 스키마 정합화를 위한 새 마이그레이션 생성"
    log_error "3. 배포 재시도"
    exit 1
fi

# 마이그레이션 상태 확인
log_info "마이그레이션 상태 확인 중..."
if npx prisma migrate status | grep -q "Up to date"; then
    log_success "마이그레이션 상태: Up to date"
else
    log_warning "마이그레이션 상태 확인 필요"
    npx prisma migrate status
fi

# 애플리케이션 시작
log_info "애플리케이션 시작 중..."
exec node dist/index.js
