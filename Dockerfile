# 멀티스테이지 빌드 - 빌드 스테이지
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 모든 의존성 설치 (빌드에 필요)
RUN npm ci

# Prisma 스키마 파일 복사
COPY prisma ./prisma

# Prisma 클라이언트 생성 (빌드 타임)
RUN npx prisma generate

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 프로덕션 스테이지
FROM node:18-alpine AS production

# curl, postgresql-client, redis 클라이언트 설치 (헬스체크 및 디버깅용)
RUN apk add --no-cache curl postgresql-client redis

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

# Prisma 스키마 파일과 마이그레이션 파일들 복사
COPY --from=builder /app/prisma ./prisma

# Prisma 클라이언트 생성된 파일들 복사 (런타임 generate 제거)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 시작 스크립트 복사
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

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