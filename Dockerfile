# 멀티스테이지 빌드 - 빌드 스테이지
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 모든 의존성 설치 (빌드에 필요)
RUN npm ci

# 소스 코드 복사
COPY . .

# Prisma 클라이언트 생성 (빌드용)
RUN npx prisma generate

# TypeScript 빌드
RUN npm run build

# 프로덕션 스테이지
FROM node:18-alpine AS production

# curl 설치 (헬스체크용)
RUN apk add --no-cache curl

# 보안을 위해 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 프로덕션 의존성만 설치 (Husky 제외)
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# 빌드된 파일들을 복사
COPY --from=builder /app/dist ./dist

# Prisma 스키마 파일과 마이그레이션 파일들 복사 (마이그레이션용)
COPY --from=builder /app/prisma ./prisma

# 시작 스크립트 생성
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "🔍 환경 변수 확인..."' >> /app/start.sh && \
    echo 'echo "DATABASE_URL: $DATABASE_URL"' >> /app/start.sh && \
    echo 'echo "NODE_ENV: $NODE_ENV"' >> /app/start.sh && \
    echo 'echo "🔄 실패한 마이그레이션 정리..."' >> /app/start.sh && \
    echo 'npx prisma migrate resolve --applied 20250811065406_make_recruit_dates_required || echo "마이그레이션 정리 완료"' >> /app/start.sh && \
    echo 'echo "🔄 데이터베이스 마이그레이션 시작..."' >> /app/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/start.sh && \
    echo 'if [ $? -eq 0 ]; then' >> /app/start.sh && \
    echo '  echo "✅ 마이그레이션 완료"' >> /app/start.sh && \
    echo '  echo "🔄 Prisma 클라이언트 재생성..."' >> /app/start.sh && \
    echo '  npx prisma generate' >> /app/start.sh && \
    echo '  echo "✅ 클라이언트 재생성 완료"' >> /app/start.sh && \
    echo '  echo "🚀 애플리케이션 시작..."' >> /app/start.sh && \
    echo '  exec node dist/index.js' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '  echo "❌ 마이그레이션 실패"' >> /app/start.sh && \
    echo '  exit 1' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    chmod +x /app/start.sh

# 사용자 권한 변경
RUN chown -R nodejs:nodejs /app
USER nodejs

# 포트 노출
EXPOSE 3000

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=Asia/Seoul

# 애플리케이션 시작 (마이그레이션 후 서버 시작)
CMD ["/app/start.sh"] 