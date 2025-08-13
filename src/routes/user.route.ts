import { Router } from 'express';
import { UserController } from '../domains/user/user.controller.js';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateUserSchema } from '../schemas/user/index.js';
import { registry } from '../config/swagger-zod.js';
import {
  SuccessResponseSchema,
  ErrorResponseSchema,
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
    method: 'put',
    path: '/api/users/profile',
    tags: ['Users'],
    summary: '사용자 프로필 수정',
    description: '현재 로그인한 사용자의 프로필 정보를 수정합니다.',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: updateUserSchema,
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

  // 실제 라우트 정의
  router.get(
    '/profile',
    authenticateToken,
    controller.getUserProfile.bind(controller)
  );
  router.put(
    '/profile',
    authenticateToken,
    validateBody(updateUserSchema),
    controller.updateUser.bind(controller)
  );
  router.delete(
    '/profile',
    authenticateToken,
    controller.deleteUser.bind(controller)
  );

  return router;
};
