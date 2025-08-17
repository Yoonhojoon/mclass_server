// 테스트 후 정리
export default async function globalTeardown() {
  // Prisma 클라이언트 연결 해제
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Prisma 연결 해제 중 오류:', error);
  }

  // Redis 연결 해제 (있는 경우)
  try {
    const Redis = await import('ioredis');
    const redis = new Redis.default(process.env.REDIS_URL);
    await redis.disconnect();
  } catch (error) {
    // Redis가 없어도 무시
  }

  // 테스트 DB 파일 정리
  try {
    const fs = await import('fs');
    if (fs.existsSync('./test.db')) {
      fs.unlinkSync('./test.db');
    }
  } catch (error) {
    console.error('테스트 DB 파일 정리 중 오류:', error);
  }
}
