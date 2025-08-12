import { Router } from 'express';
import { AuthController } from '../domains/auth/auth.controller.js';
import {
  authenticateToken,
  requireSignUpCompleted,
} from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  loginSchema,
  registerSchema,
  socialLoginSchema,
  completeSignUpSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../schemas/auth/index.js';

import { PrismaClient } from '@prisma/client';
import { registry } from '../config/swagger-zod.js';
import {
  SuccessResponseSchema,
  ErrorResponseSchema,
} from '../config/swagger-zod.js';

/**
 * 인증 라우트 팩토리 함수
 * 의존성 주입을 통해 테스트 가능하고 유연한 구조 제공
 */
export const createAuthRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const authController = new AuthController(prisma);

  // OpenAPI 경로 등록
  registry.registerPath({
    method: 'post',
    path: '/api/auth/login',
    tags: ['인증'],
    summary: '사용자 로그인',
    description: '이메일과 비밀번호를 사용하여 로그인합니다.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: loginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '로그인 성공',
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
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/auth/register',
    tags: ['인증'],
    summary: '사용자 회원가입',
    description: '새로운 사용자를 등록합니다.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: registerSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: '회원가입 성공',
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
      409: {
        description: '이미 존재하는 사용자',
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
    path: '/api/auth/social/login',
    tags: ['인증'],
    summary: '소셜 로그인',
    description: '소셜 로그인 제공자의 액세스 토큰을 사용하여 로그인합니다.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: socialLoginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '소셜 로그인 성공',
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
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/auth/complete-signup',
    tags: ['인증'],
    summary: '회원가입 완료',
    description: '소셜 로그인 사용자의 회원가입을 완료합니다.',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: completeSignUpSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '회원가입 완료 성공',
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
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/auth/refresh',
    tags: ['인증'],
    summary: '토큰 갱신',
    description: '리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: refreshTokenSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '토큰 갱신 성공',
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
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/auth/logout',
    tags: ['인증'],
    summary: '로그아웃',
    description: '사용자 로그아웃을 수행합니다.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: '로그아웃 성공',
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

  registry.registerPath({
    method: 'post',
    path: '/api/auth/change-password',
    tags: ['인증'],
    summary: '비밀번호 변경',
    description: '현재 비밀번호를 확인하고 새 비밀번호로 변경합니다.',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: changePasswordSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '비밀번호 변경 성공',
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
    },
  });

  // 실제 라우트 정의
  router.post('/login', validateBody(loginSchema), authController.login);
  router.post(
    '/register',
    validateBody(registerSchema),
    authController.register
  );
  router.post(
    '/social/login',
    validateBody(socialLoginSchema),
    authController.socialLogin
  );
  router.post(
    '/complete-signup',
    authenticateToken,
    requireSignUpCompleted,
    validateBody(completeSignUpSchema),
    authController.completeSignUp
  );
  router.post(
    '/refresh',
    validateBody(refreshTokenSchema),
    authController.refreshToken
  );
  router.post('/logout', authenticateToken, authController.logout);
  router.post(
    '/change-password',
    authenticateToken,
    validateBody(changePasswordSchema),
    authController.changePassword
  );

  return router;
};
