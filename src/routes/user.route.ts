import { Router } from 'express';
import { UserController } from '../domains/user/user.controller.js';
import { PrismaClient } from '@prisma/client';
import {
  authenticateToken,
  requireSignUpCompleted,
} from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateUserProfileSchema } from '../schemas/user/update.schema.js';
import { adminUpdateUserRoleSchema } from '../schemas/user/update.schema.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { registry } from '../config/swagger-zod.js';
import {
  SuccessResponseSchema,
  BadRequestErrorSchema,
  UnauthorizedErrorSchema,
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
} from '../config/swagger-zod.js';

/**
 * 사용자 라우트 팩토리 함수
 * 의존성 주입을 통해 테스트 가능하고 유연한 구조 제공
 */
export const createUserRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new UserController(prisma);

  // OpenAPI 경로 등록
  registry.registerPath({
    method: 'get',
    path: '/api/users/profile',
    tags: ['Users'],
    summary: '사용자 프로필 조회',
    description: '현재 로그인한 사용자의 프로필 정보를 조회합니다.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: '프로필 조회 성공',
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
            schema: UnauthorizedErrorSchema,
          },
        },
      },
      404: {
        description: '사용자를 찾을 수 없음',
        content: {
          'application/json': {
            schema: NotFoundErrorSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/users/profile',
    tags: ['Users'],
    summary: '사용자 프로필 수정',
    description:
      '현재 로그인한 사용자의 프로필 정보를 수정합니다. (역할 수정 불가)',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: updateUserProfileSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '프로필 수정 성공',
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
            schema: BadRequestErrorSchema,
          },
        },
      },
      401: {
        description: '인증 실패',
        content: {
          'application/json': {
            schema: UnauthorizedErrorSchema,
          },
        },
      },
      404: {
        description: '사용자를 찾을 수 없음',
        content: {
          'application/json': {
            schema: NotFoundErrorSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/users/{id}/role',
    tags: ['Users'],
    summary: '사용자 역할 수정 (관리자 전용)',
    description: '관리자가 특정 사용자의 역할을 수정합니다.',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminUpdateUserRoleSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '역할 수정 성공',
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
            schema: BadRequestErrorSchema,
          },
        },
      },
      401: {
        description: '인증 실패',
        content: {
          'application/json': {
            schema: UnauthorizedErrorSchema,
          },
        },
      },
      403: {
        description: '권한 없음',
        content: {
          'application/json': {
            schema: ForbiddenErrorSchema,
          },
        },
      },
      404: {
        description: '사용자를 찾을 수 없음',
        content: {
          'application/json': {
            schema: NotFoundErrorSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/users/profile',
    tags: ['Users'],
    summary: '사용자 계정 삭제',
    description: '현재 로그인한 사용자의 계정을 삭제합니다.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: '계정 삭제 성공',
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
            schema: UnauthorizedErrorSchema,
          },
        },
      },
      404: {
        description: '사용자를 찾을 수 없음',
        content: {
          'application/json': {
            schema: NotFoundErrorSchema,
          },
        },
      },
    },
  });

  // 실제 라우트 정의
  router.get(
    '/profile',
    authenticateToken,
    controller.getUserProfile.bind(controller)
  );

  // 일반 사용자 프로필 수정
  router.put(
    '/profile',
    authenticateToken,
    requireSignUpCompleted,
    validateBody(updateUserProfileSchema),
    controller.updateUserProfile.bind(controller)
  );

  // 관리자 전용 역할 수정
  router.put(
    '/:id/role',
    authenticateToken,
    requireAdmin,
    validateBody(adminUpdateUserRoleSchema),
    controller.updateUserRole.bind(controller)
  );

  return router;
};
