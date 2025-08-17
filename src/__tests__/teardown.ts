// 테스트 후 정리
export default async function globalTeardown() {
  // Prisma 클라이언트 연결 해제
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  } catch (error) {
    console.error('Prisma 연결 해제 중 오류:', error);
  }

  // 테스트 DB 파일 정리
  try {
    const fs = await import('fs');
    const path = await import('path');
    const testDbPath = path.join(process.cwd(), 'test.db');

    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log('테스트 DB 파일이 정리되었습니다.');
    }
  } catch (error) {
    console.error('테스트 DB 파일 정리 중 오류:', error);
  }
}
