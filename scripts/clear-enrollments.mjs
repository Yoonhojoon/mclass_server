import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearEnrollments() {
  const mclassId = "b21c86a0-383a-4d46-9376-fcf246028d13";

  try {
    console.log('🧹 기존 신청 데이터 삭제 중...');

    // 해당 클래스의 모든 신청 삭제
    const result = await prisma.enrollment.deleteMany({
      where: {
        mclassId: mclassId
      }
    });

    console.log(`✅ ${result.count}개의 신청 데이터가 삭제되었습니다.`);

    // 삭제 후 확인
    const remainingEnrollments = await prisma.enrollment.count({
      where: {
        mclassId: mclassId
      }
    });

    console.log(`📊 남은 신청 수: ${remainingEnrollments}개`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearEnrollments();
