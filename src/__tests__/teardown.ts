// 테스트 후 정리
export default async function globalTeardown() {
  console.log('🧹 테스트 정리 작업 시작...');

  // Prisma 클라이언트 연결 해제
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$disconnect();
    console.log('✅ Prisma 연결이 해제되었습니다.');
  } catch {
    console.error('❌ Prisma 연결 해제 중 오류가 발생했습니다.');
  }

  // Redis 연결 해제 (테스트 환경에서만)
  try {
    // Redis 연결이 있는 경우에만 해제 시도
    const { redis } = await import('../config/redis.config.js');
    if (redis && typeof redis.disconnect === 'function') {
      await redis.disconnect();
      console.log('✅ Redis 연결이 해제되었습니다.');
    }
  } catch {
    // Redis 연결이 없거나 이미 해제된 경우는 무시
    console.log('ℹ️ Redis 연결 해제 건너뜀 (연결이 없거나 이미 해제됨)');
  }

  // 모든 타이머 정리
  try {
    // Node.js의 모든 타이머 정리
    const timers = require('timers');
    if (timers.clearImmediate) timers.clearImmediate();
    if (timers.clearInterval) timers.clearInterval();
    if (timers.clearTimeout) timers.clearTimeout();
    console.log('✅ 모든 타이머가 정리되었습니다.');
  } catch {
    console.error('❌ 타이머 정리 중 오류가 발생했습니다.');
  }

  // 테스트 DB 파일 정리
  try {
    const fs = await import('fs');
    const path = await import('path');
    const testDbPath = path.join(process.cwd(), 'test.db');

    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log('✅ 테스트 DB 파일이 정리되었습니다.');
    }
  } catch {
    console.error('❌ 테스트 DB 파일 정리 중 오류가 발생했습니다.');
  }

  // 프로세스 종료 전 잠시 대기 (비동기 작업 완료를 위해)
  await new Promise(resolve => {
    const timer = require('timers').setTimeout(resolve, 100);
    return () => require('timers').clearTimeout(timer);
  });

  console.log('✅ 테스트 정리 작업 완료');
}
