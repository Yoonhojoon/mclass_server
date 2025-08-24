import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/mclass_dev'
    }
  }
});

async function checkEnrollments() {
  const mclassId = "0ad687e8-57c4-4f27-b189-c730790b32de";

  try {
    // 클래스 정보 조회
    const mclass = await prisma.mclass.findUnique({
      where: { id: mclassId },
      include: {
        enrollments: {
          include: {
            user: true
          }
        }
      }
    });

    if (!mclass) {
      console.log('❌ 클래스를 찾을 수 없습니다.');
      return;
    }

    console.log(`📊 클래스 정보: ${mclass.title}`);
    console.log(`📅 신청 기간: ${mclass.recruitStartAt} ~ ${mclass.recruitEndAt}`);
    console.log(`👥 정원: ${mclass.capacity}명`);
    console.log(`⏳ 대기열 정원: ${mclass.waitlistCapacity}명`);
    console.log(`📝 신청 방식: ${mclass.selectionType}`);
    console.log('');

    // 신청 통계
    const totalEnrollments = mclass.enrollments.length;
    const approvedCount = mclass.enrollments.filter(e => e.status === 'APPROVED').length;
    const waitlistedCount = mclass.enrollments.filter(e => e.status === 'WAITLISTED').length;
    const appliedCount = mclass.enrollments.filter(e => e.status === 'APPLIED').length;

    console.log(`📈 신청 통계:`);
    console.log(`   총 신청: ${totalEnrollments}명`);
    console.log(`   승인: ${approvedCount}명`);
    console.log(`   대기: ${waitlistedCount}명`);
    console.log(`   신청: ${appliedCount}명`);
    console.log('');

    // 최근 신청 10개
    console.log(`🕒 최근 신청 10개:`);
    const recentEnrollments = mclass.enrollments
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
      .slice(0, 10);

    recentEnrollments.forEach((enrollment, index) => {
      console.log(`   ${index + 1}. ${enrollment.user.email} - ${enrollment.status} (${enrollment.appliedAt})`);
    });

    // 중복 신청 확인
    const userEnrollmentCounts = {};
    mclass.enrollments.forEach(enrollment => {
      userEnrollmentCounts[enrollment.userId] = (userEnrollmentCounts[enrollment.userId] || 0) + 1;
    });

    const duplicateUsers = Object.entries(userEnrollmentCounts)
      .filter(([userId, count]) => count > 1)
      .map(([userId, count]) => ({ userId, count }));

    if (duplicateUsers.length > 0) {
      console.log('');
      console.log(`⚠️ 중복 신청 사용자 (${duplicateUsers.length}명):`);
      duplicateUsers.forEach(({ userId, count }) => {
        const user = mclass.enrollments.find(e => e.userId === userId)?.user;
        console.log(`   ${user?.email || userId}: ${count}회 신청`);
      });
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnrollments();
