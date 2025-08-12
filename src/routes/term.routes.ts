import { Router, Request, Response } from 'express';
import { TermController } from '../domains/term/term.controller.js';
import { TermService } from '../domains/term/term.service.js';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middleware/validate.middleware.js';
import {
  createTermSchema,
  updateTermSchema,
  agreeToTermSchema,
  termIdParamSchema,
} from '../schemas/term/index.js';
import { registry } from '../config/swagger-zod.js';
import {
  SuccessResponseSchema,
  ErrorResponseSchema,
} from '../config/swagger-zod.js';

/**
 * 약관 라우트 팩토리 함수
 * 의존성 주입을 통해 테스트 가능하고 유연한 구조 제공
 */
export const createTermRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const termService = new TermService(prisma);
  const termController = new TermController(termService);

  // OpenAPI 경로 등록
  registry.registerPath({
    method: 'get',
    path: '/api/terms',
    tags: ['Terms'],
    summary: '모든 약관 목록 조회',
    description: '시스템에 등록된 모든 약관 목록을 조회합니다.',
    responses: {
      200: {
        description: '약관 목록 조회 성공',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      500: {
        description: '서버 오류',
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
    path: '/api/terms/{id}',
    tags: ['Terms'],
    summary: '특정 약관 조회',
    description: 'ID로 특정 약관을 조회합니다.',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: '약관 ID',
      },
    ],
    responses: {
      200: {
        description: '약관 조회 성공',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      400: {
        description: '잘못된 ID 형식',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: '약관을 찾을 수 없음',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      500: {
        description: '서버 오류',
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
    path: '/api/terms',
    tags: ['Terms'],
    summary: '약관 생성',
    description: '새로운 약관을 생성합니다. (관리자만 가능)',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: createTermSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: '약관 생성 성공',
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
    method: 'put',
    path: '/api/terms/{id}',
    tags: ['Terms'],
    summary: '약관 수정',
    description: '기존 약관을 수정합니다. (관리자만 가능)',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: '약관 ID',
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: updateTermSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '약관 수정 성공',
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
      403: {
        description: '권한 없음',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: '약관을 찾을 수 없음',
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
    path: '/api/terms/{id}',
    tags: ['Terms'],
    summary: '약관 삭제',
    description: '약관을 삭제합니다. (관리자만 가능)',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: '약관 ID',
      },
    ],
    responses: {
      200: {
        description: '약관 삭제 성공',
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
        description: '약관을 찾을 수 없음',
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
    path: '/api/terms/{id}/agree',
    tags: ['Terms'],
    summary: '약관 동의',
    description: '특정 약관에 동의합니다.',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: '약관 ID',
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: agreeToTermSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '약관 동의 성공',
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
        description: '약관을 찾을 수 없음',
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
    path: '/api/terms/{id}/user-agreement',
    tags: ['Terms'],
    summary: '사용자 약관 동의 상태 조회',
    description: '특정 사용자의 약관 동의 상태를 조회합니다.',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: '약관 ID',
      },
    ],
    responses: {
      200: {
        description: '동의 상태 조회 성공',
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
        description: '약관을 찾을 수 없음',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // 실제 라우트 정의
  router.get('/terms', (req: Request, res: Response): void => {
    termController.getAllTerms(req, res);
  });

  router.get('/terms/:id', validateParams(termIdParamSchema), (req, res) =>
    termController.getTermById(req, res)
  );

  router.post(
    '/terms',
    authenticateToken,
    validateBody(createTermSchema),
    (req, res) => termController.createTerm(req, res)
  );

  router.put(
    '/terms/:id',
    authenticateToken,
    validateParams(termIdParamSchema),
    validateBody(updateTermSchema),
    (req, res) => termController.updateTerm(req, res)
  );

  router.delete(
    '/terms/:id',
    authenticateToken,
    validateParams(termIdParamSchema),
    (req, res) => termController.deleteTerm(req, res)
  );

  router.post(
    '/terms/:id/agree',
    authenticateToken,
    validateParams(termIdParamSchema),
    validateBody(agreeToTermSchema),
    (req, res) => termController.agreeToTerm(req, res)
  );

  router.get(
    '/terms/:id/user-agreement',
    authenticateToken,
    validateParams(termIdParamSchema),
    (req, res) => termController.getUserAgreements(req, res)
  );

  return router;
};

// 기본 export는 기존 호환성을 위해 유지
export default createTermRoutes;
