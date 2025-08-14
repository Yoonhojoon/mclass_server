import { Router } from 'express';
import { EnrollmentController } from '../domains/enrollment/enrollment.controller.js';
import { EnrollmentService } from '../domains/enrollment/enrollment.service.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// 컨트롤러 인스턴스 생성 (의존성 주입은 나중에 처리)
const enrollmentController = new EnrollmentController({} as EnrollmentService);

// 사용자 API (인증 필요)
router.use('/enrollments', requireAuth);

// 내 신청 목록 조회
router.get(
  '/enrollments/my',
  enrollmentController.getMyEnrollments.bind(enrollmentController)
);

// 내 신청 상세 조회
router.get(
  '/enrollments/my/:enrollmentId',
  enrollmentController.getMyEnrollment.bind(enrollmentController)
);

// 신청 취소
router.delete(
  '/enrollments/my/:enrollmentId',
  enrollmentController.cancelEnrollment.bind(enrollmentController)
);

// 신청 수정
router.put(
  '/enrollments/my/:enrollmentId',
  enrollmentController.updateEnrollment.bind(enrollmentController)
);

// 클래스 신청
router.post(
  '/mclasses/:mclassId/enrollments',
  enrollmentController.enrollToClass.bind(enrollmentController)
);

// 관리자 API (관리자 권한 필요)
router.use('/admin', requireAuth, requireAdmin);

// 관리자: 클래스별 신청 목록 조회
router.get(
  '/admin/mclasses/:mclassId/enrollments',
  enrollmentController.getEnrollmentsByMclass.bind(enrollmentController)
);

// 관리자: 신청 상태 변경
router.patch(
  '/admin/enrollments/:enrollmentId/status',
  enrollmentController.updateEnrollmentStatus.bind(enrollmentController)
);

// 관리자: 신청 통계 조회
router.get(
  '/admin/mclasses/:mclassId/enrollments/stats',
  enrollmentController.getEnrollmentStats.bind(enrollmentController)
);

// 관리자: 신청 상세 조회
router.get(
  '/admin/enrollments/:enrollmentId',
  enrollmentController.getEnrollmentDetail.bind(enrollmentController)
);

export default router;
