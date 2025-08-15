import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AdminController } from '../domains/admin/admin.controller.js';
import { AdminService } from '../domains/admin/admin.service.js';
import { ServiceContainer } from '../services/email/index.js';
import { PrismaClient } from '@prisma/client';
import {
  authenticateToken,
  requireAdmin,
} from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middleware/validate.middleware.js';
import { AuthenticatedRequest } from '../types/express.js';
import { registry } from '../config/swagger-zod.js';
import {
  SuccessResponseSchema,
  ErrorResponseSchema,
} from '../config/swagger-zod.js';
import {
  updateUserRoleSchema,
  adminUserIdParamSchema,
  userRoleResponseSchema,
  adminCountResponseSchema,
  usersListResponseSchema,
} from '../schemas/admin/index.js';

// 이메일 테스트 스키마
const emailTestSchema = z.object({
  to: z.string().email('유효한 이메일 주소를 입력하세요'),
  template: z.string().optional().default('enrollment-status'),
});
import logger from '../config/logger.config.js';

/**
 * 관리자 라우트 팩토리 함수
 * 의존성 주입을 통해 테스트 가능하고 유연한 구조 제공
 */
export const createAdminRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const adminService = new AdminService(prisma);
  const emailService = ServiceContainer.getEmailService(logger);
  const adminController = new AdminController(adminService, emailService);

  // OpenAPI 경로 등록
  registry.registerPath({
    method: 'get',
    path: '/api/admin/users/{id}/role',
    tags: ['Admin'],
    summary: '사용자 권한 조회',
    description: '특정 사용자의 권한 정보를 조회합니다.',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: '사용자 ID',
      },
    ],
    responses: {
      200: {
        description: '사용자 권한 조회 성공',
        content: {
          'application/json': {
            schema: SuccessResponseSchema.extend({
              data: userRoleResponseSchema,
            }),
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
        description: '사용자를 찾을 수 없음',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/admin/users/{id}/role',
    tags: ['Admin'],
    summary: '사용자 권한 변경',
    description: '특정 사용자의 권한을 변경합니다. (관리자만 가능)',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: '변경할 사용자 ID',
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: updateUserRoleSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '권한 변경 성공',
        content: {
          'application/json': {
            schema: SuccessResponseSchema.extend({
              data: userRoleResponseSchema,
            }),
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
      403: {
        description: '권한 없음',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: '사용자를 찾을 수 없음',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/admin/users',
    tags: ['Admin'],
    summary: '모든 사용자 목록 조회',
    description: '시스템의 모든 사용자 목록을 조회합니다. (관리자만 가능)',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: '사용자 목록 조회 성공',
        content: {
          'application/json': {
            schema: SuccessResponseSchema.extend({
              data: usersListResponseSchema,
              count: z.number(),
            }),
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

  registry.registerPath({
    method: 'get',
    path: '/api/admin/admin-count',
    tags: ['Admin'],
    summary: '관리자 수 조회',
    description: '시스템의 관리자 수를 조회합니다. (관리자만 가능)',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: '관리자 수 조회 성공',
        content: {
          'application/json': {
            schema: SuccessResponseSchema.extend({
              data: adminCountResponseSchema,
            }),
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

  registry.registerPath({
    method: 'post',
    path: '/api/admin/test-email',
    tags: ['Admin'],
    summary: '이메일 테스트 발송',
    description:
      '이메일 서비스가 정상적으로 작동하는지 테스트합니다. (관리자만 가능)',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: emailTestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '이메일 테스트 발송 성공',
        content: {
          'application/json': {
            schema: SuccessResponseSchema.extend({
              data: z.object({
                to: z.string(),
                template: z.string(),
                sentAt: z.string(),
              }),
            }),
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
      403: {
        description: '권한 없음',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      500: {
        description: '이메일 발송 실패',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // 실제 라우트 정의
  router.get(
    '/users/:id/role',
    authenticateToken,
    requireAdmin,
    validateParams(adminUserIdParamSchema),
    async (req: Request, res: Response): Promise<void> =>
      adminController.getUserRole(req as AuthenticatedRequest, res)
  );

  router.patch(
    '/users/:id/role',
    authenticateToken,
    requireAdmin,
    validateParams(adminUserIdParamSchema),
    validateBody(updateUserRoleSchema),
    async (req: Request, res: Response): Promise<void> =>
      adminController.updateUserRole(req as AuthenticatedRequest, res)
  );

  router.get(
    '/users',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response): Promise<void> =>
      adminController.getAllUsers(req as AuthenticatedRequest, res)
  );

  router.get(
    '/admin-count',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response): Promise<void> =>
      adminController.getAdminCount(req as AuthenticatedRequest, res)
  );

  router.post(
    '/test-email',
    authenticateToken,
    requireAdmin,
    validateBody(emailTestSchema),
    async (req: Request, res: Response): Promise<void> =>
      adminController.testEmail(req as AuthenticatedRequest, res)
  );

  return router;
};

// 기본 export는 기존 호환성을 위해 유지
export default createAdminRoutes;
