import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'pretty',
    // 트랜잭션 타임아웃 설정 추가
    transactionOptions: {
      timeout: 10000, // 10초
      maxWait: 5000, // 최대 대기 시간
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
} else {
  // Handle graceful shutdown in production
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
