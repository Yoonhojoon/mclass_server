import { Router } from 'express';
import { EnrollmentController } from '../domains/enrollment/enrollment.controller.js';
import { EnrollmentService } from '../domains/enrollment/enrollment.service.js';
import {
  authenticateToken,
  requireAdmin,
} from '../middleware/auth.middleware.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.middleware.js';
import {
  CreateEnrollmentSchema,
  UpdateEnrollmentSchema,
  CancelEnrollmentSchema,
  UpdateEnrollmentStatusSchema,
  EnrollmentQuerySchema,
  AdminEnrollmentQuerySchema,
  mclassIdParamSchema,
  enrollmentIdParamSchema,
} from '../schemas/enrollment/index.js';
import { registry } from '../config/swagger-zod.js';
import {
  SuccessResponseSchema,
  ErrorResponseSchema,
} from '../config/swagger-zod.js';

const router = Router();

// 컨트롤러 인스턴스 생성 (의존성 주입은 나중에 처리)
const enrollmentController = new EnrollmentController({} as EnrollmentService);

// OpenAPI 경로 등록 - 사용자 API

// 내 신청 목록 조회
registry.registerPath({
  method: 'get',
  path: '/api/enrollments/my',
  tags: ['Enrollment'],
  summary: '내 신청 목록 조회',
  description: '현재 로그인한 사용자의 신청 목록을 조회합니다.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'status',
      in: 'query',
      schema: {
        type: 'string',
        enum: ['APPLIED', 'APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELED'],
      },
      description: '신청 상태 필터',
    },
    {
      name: 'page',
      in: 'query',
      schema: { type: 'integer', minimum: 1, default: 1 },
      description: '페이지 번호',
    },
    {
      name: 'limit',
      in: 'query',
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      description: '페이지당 항목 수',
    },
  ],
  responses: {
    200: {
      description: '신청 목록 조회 성공',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// 내 신청 상세 조회
registry.registerPath({
  method: 'get',
  path: '/api/enrollments/my/{enrollmentId}',
  tags: ['Enrollment'],
  summary: '내 신청 상세 조회',
  description: '현재 로그인한 사용자의 특정 신청 상세 정보를 조회합니다.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'enrollmentId',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      description: '신청 ID',
    },
  ],
  responses: {
    200: {
      description: '신청 상세 조회 성공',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: '신청을 찾을 수 없음',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// 신청 취소
registry.registerPath({
  method: 'delete',
  path: '/api/enrollments/my/{enrollmentId}',
  tags: ['Enrollment'],
  summary: '신청 취소',
  description: '현재 로그인한 사용자의 신청을 취소합니다.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'enrollmentId',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      description: '신청 ID',
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CancelEnrollment' },
        },
      },
    },
  },
  responses: {
    200: {
      description: '신청 취소 성공',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: '신청을 찾을 수 없음',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// 신청 수정
registry.registerPath({
  method: 'put',
  path: '/api/enrollments/my/{enrollmentId}',
  tags: ['Enrollment'],
  summary: '신청 수정',
  description: '현재 로그인한 사용자의 신청 내용을 수정합니다.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'enrollmentId',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      description: '신청 ID',
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateEnrollment' },
        },
      },
    },
  },
  responses: {
    200: {
      description: '신청 수정 성공',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: '신청을 찾을 수 없음',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// 클래스 신청
registry.registerPath({
  method: 'post',
  path: '/api/mclasses/{mclassId}/enrollments',
  tags: ['Enrollment'],
  summary: '클래스 신청',
  description: '특정 클래스에 신청합니다.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'mclassId',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      description: '클래스 ID',
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateEnrollment' },
        },
      },
    },
  },
  responses: {
    201: {
      description: '신청 생성 성공',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: '잘못된 요청',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: '클래스를 찾을 수 없음',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// OpenAPI 경로 등록 - 관리자 API

// 관리자: 클래스별 신청 목록 조회
registry.registerPath({
  method: 'get',
  path: '/api/admin/mclasses/{mclassId}/enrollments',
  tags: ['Admin'],
  summary: '클래스별 신청 목록 조회',
  description: '관리자가 특정 클래스의 신청 목록을 조회합니다.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'mclassId',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      description: '클래스 ID',
    },
    {
      name: 'status',
      in: 'query',
      schema: {
        type: 'string',
        enum: ['APPLIED', 'APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELED'],
      },
      description: '신청 상태 필터',
    },
    {
      name: 'page',
      in: 'query',
      schema: { type: 'integer', minimum: 1, default: 1 },
      description: '페이지 번호',
    },
    {
      name: 'limit',
      in: 'query',
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      description: '페이지당 항목 수',
    },
    {
      name: 'search',
      in: 'query',
      schema: { type: 'string' },
      description: '사용자 이름/이메일 검색',
    },
  ],
  responses: {
    200: {
      description: '신청 목록 조회 성공',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: '권한 없음',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// 관리자: 신청 상태 변경
registry.registerPath({
  method: 'patch',
  path: '/api/admin/enrollments/{enrollmentId}/status',
  tags: ['Admin'],
  summary: '신청 상태 변경',
  description: '관리자가 신청 상태를 변경합니다.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'enrollmentId',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      description: '신청 ID',
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateEnrollmentStatus' },
        },
      },
    },
  },
  responses: {
    200: {
      description: '상태 변경 성공',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: '권한 없음',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: '신청을 찾을 수 없음',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// 관리자: 신청 통계 조회
registry.registerPath({
  method: 'get',
  path: '/api/admin/mclasses/{mclassId}/enrollments/stats',
  tags: ['Admin'],
  summary: '신청 통계 조회',
  description: '관리자가 특정 클래스의 신청 통계를 조회합니다.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'mclassId',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      description: '클래스 ID',
    },
  ],
  responses: {
    200: {
      description: '통계 조회 성공',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: '권한 없음',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// 관리자: 신청 상세 조회
registry.registerPath({
  method: 'get',
  path: '/api/admin/enrollments/{enrollmentId}',
  tags: ['Admin'],
  summary: '신청 상세 조회',
  description: '관리자가 특정 신청의 상세 정보를 조회합니다.',
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'enrollmentId',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      description: '신청 ID',
    },
  ],
  responses: {
    200: {
      description: '신청 상세 조회 성공',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    401: {
      description: '인증 실패',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: '권한 없음',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: '신청을 찾을 수 없음',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// 실제 라우트 정의

// 사용자 API (인증 필요)
router.use('/enrollments', authenticateToken, requireAuth);

// 내 신청 목록 조회
router.get(
  '/enrollments/my',
  validateQuery(EnrollmentQuerySchema),
  enrollmentController.getMyEnrollments.bind(enrollmentController)
);

// 내 신청 상세 조회
router.get(
  '/enrollments/my/:enrollmentId',
  validateParams(enrollmentIdParamSchema),
  enrollmentController.getMyEnrollment.bind(enrollmentController)
);

// 신청 취소
router.delete(
  '/enrollments/my/:enrollmentId',
  validateParams(enrollmentIdParamSchema),
  validateBody(CancelEnrollmentSchema),
  enrollmentController.cancelEnrollment.bind(enrollmentController)
);

// 신청 수정
router.put(
  '/enrollments/my/:enrollmentId',
  validateParams(enrollmentIdParamSchema),
  validateBody(UpdateEnrollmentSchema),
  enrollmentController.updateEnrollment.bind(enrollmentController)
);

// 클래스 신청
router.post(
  '/mclasses/:mclassId/enrollments',
  validateParams(mclassIdParamSchema),
  validateBody(CreateEnrollmentSchema),
  enrollmentController.enrollToClass.bind(enrollmentController)
);

// 관리자 API (관리자 권한 필요)
router.use('/admin', authenticateToken, requireAuth, requireAdmin);

// 관리자: 클래스별 신청 목록 조회
router.get(
  '/admin/mclasses/:mclassId/enrollments',
  validateParams(mclassIdParamSchema),
  validateQuery(AdminEnrollmentQuerySchema),
  enrollmentController.getEnrollmentsByMclass.bind(enrollmentController)
);

// 관리자: 신청 상태 변경
router.patch(
  '/admin/enrollments/:enrollmentId/status',
  validateParams(enrollmentIdParamSchema),
  validateBody(UpdateEnrollmentStatusSchema),
  enrollmentController.updateEnrollmentStatus.bind(enrollmentController)
);

// 관리자: 신청 통계 조회
router.get(
  '/admin/mclasses/:mclassId/enrollments/stats',
  validateParams(mclassIdParamSchema),
  enrollmentController.getEnrollmentStats.bind(enrollmentController)
);

// 관리자: 신청 상세 조회
router.get(
  '/admin/enrollments/:enrollmentId',
  validateParams(enrollmentIdParamSchema),
  enrollmentController.getEnrollmentDetail.bind(enrollmentController)
);

export default router;
