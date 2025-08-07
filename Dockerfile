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

# Prisma 클라이언트 생성
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

# Prisma 클라이언트 복사
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Prisma 스키마 파일 복사 (마이그레이션용)
COPY --from=builder /app/prisma ./prisma

# 사용자 권한 변경
RUN chown -R nodejs:nodejs /app
USER nodejs

# 포트 노출
EXPOSE 3000

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# 애플리케이션 시작 (마이그레이션 후 서버 시작)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"] 