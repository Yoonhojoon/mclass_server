import { Router } from 'express';
import { EnrollmentFormController } from '../domains/enrollmentForm/enrollmentForm.controller.js';
import { EnrollmentFormService } from '../domains/enrollmentForm/enrollmentForm.service.js';
import { EnrollmentFormRepository } from '../domains/enrollmentForm/enrollmentForm.repository.js';
import { PrismaClient } from '@prisma/client';
import {
  authenticateToken,
  requireSignUpCompleted,
} from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middleware/validate.middleware.js';
import {
  CreateEnrollmentFormSchema,
  UpdateEnrollmentFormSchema,
  mClassIdForEnrollmentFormParamSchema,
} from '../schemas/enrollmentForm/index.js';
import { registry } from '../config/swagger-zod.js';
import {
  SuccessResponseSchema,
  ErrorResponseSchema,
} from '../config/swagger-zod.js';

export const createEnrollmentFormRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const repository = new EnrollmentFormRepository(prisma);
  const service = new EnrollmentFormService(repository);
  const controller = new EnrollmentFormController(service);

  // OpenAPI 경로 등록
  registry.registerPath({
    method: 'get',
    path: '/api/mclasses/{id}/enrollment-form',
    tags: ['EnrollmentForm'],
    summary: 'MClass 지원서 양식 조회',
    description: '특정 MClass의 지원서 양식을 조회합니다.',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'MClass ID',
      },
    ],
    responses: {
      200: {
        description: '지원서 양식 조회 성공',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      404: {
        description: '지원서 양식을 찾을 수 없음',
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
    path: '/api/mclasses/{id}/enrollment-form',
    tags: ['EnrollmentForm'],
    summary: 'MClass 지원서 양식 생성',
    description: '특정 MClass의 지원서 양식을 생성합니다. (관리자만 가능)',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'MClass ID',
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateEnrollmentFormSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: '지원서 양식 생성 성공',
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
        description: 'MClass를 찾을 수 없음',
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
    path: '/api/mclasses/{id}/enrollment-form',
    tags: ['EnrollmentForm'],
    summary: 'MClass 지원서 양식 수정',
    description: '특정 MClass의 지원서 양식을 수정합니다. (관리자만 가능)',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'MClass ID',
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdateEnrollmentFormSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '지원서 양식 수정 성공',
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
        description: '지원서 양식을 찾을 수 없음',
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
    path: '/api/mclasses/{id}/enrollment-form',
    tags: ['EnrollmentForm'],
    summary: 'MClass 지원서 양식 삭제',
    description: '특정 MClass의 지원서 양식을 삭제합니다. (관리자만 가능)',
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'MClass ID',
      },
    ],
    responses: {
      200: {
        description: '지원서 양식 삭제 성공',
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
        description: '지원서 양식을 찾을 수 없음',
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
    '/mclasses/:id/enrollment-form',
    validateParams(mClassIdForEnrollmentFormParamSchema),
    controller.getEnrollmentForm.bind(controller)
  );

  router.post(
    '/mclasses/:id/enrollment-form',
    authenticateToken,
    requireSignUpCompleted,
    validateParams(mClassIdForEnrollmentFormParamSchema),
    validateBody(CreateEnrollmentFormSchema),
    controller.createEnrollmentForm.bind(controller)
  );

  router.put(
    '/mclasses/:id/enrollment-form',
    authenticateToken,
    requireSignUpCompleted,
    validateParams(mClassIdForEnrollmentFormParamSchema),
    validateBody(UpdateEnrollmentFormSchema),
    controller.updateEnrollmentForm.bind(controller)
  );

  router.delete(
    '/mclasses/:id/enrollment-form',
    authenticateToken,
    requireSignUpCompleted,
    validateParams(mClassIdForEnrollmentFormParamSchema),
    controller.deleteEnrollmentForm.bind(controller)
  );

  return router;
};
