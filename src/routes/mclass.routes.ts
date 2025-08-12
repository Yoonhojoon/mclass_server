import { Router } from 'express';
import { MClassController } from '../domains/mclass/mclass.controller.js';
import { MClassService } from '../domains/mclass/mclass.service.js';
import { MClassRepository } from '../domains/mclass/mclass.repository.js';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middleware/validate.middleware.js';
import {
  createMClassSchema,
  updateMClassSchema,
  mClassIdParamSchema,
} from '../schemas/mclass/index.js';
import { registry } from '../config/swagger-zod.js';
import {
  SuccessResponseSchema,
  ErrorResponseSchema,
} from '../config/swagger-zod.js';

const router = Router();
const prisma = new PrismaClient();
const repository = new MClassRepository(prisma);
const service = new MClassService(repository);
const controller = new MClassController(service);

// OpenAPI 경로 등록
registry.registerPath({
  method: 'get',
  path: '/api/mclass',
  tags: ['MClass'],
  summary: 'MClass 목록 조회',
  description:
    '필터링, 정렬, 페이지네이션을 지원하는 MClass 목록을 조회합니다.',
  responses: {
    200: {
      description: 'MClass 목록 조회 성공',
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
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/mclass/{id}',
  tags: ['MClass'],
  summary: 'MClass 상세 조회',
  description: '특정 MClass의 상세 정보를 조회합니다.',
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
      description: 'MClass 상세 조회 성공',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
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
  method: 'post',
  path: '/api/mclass',
  tags: ['MClass'],
  summary: 'MClass 생성',
  description: '새로운 MClass를 생성합니다. (관리자만 가능)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createMClassSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'MClass 생성 성공',
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
  method: 'put',
  path: '/api/mclass/{id}',
  tags: ['MClass'],
  summary: 'MClass 수정',
  description: '특정 MClass를 수정합니다. (관리자만 가능)',
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
          schema: updateMClassSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'MClass 수정 성공',
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
  method: 'delete',
  path: '/api/mclass/{id}',
  tags: ['MClass'],
  summary: 'MClass 삭제',
  description: '특정 MClass를 삭제합니다. (관리자만 가능)',
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
      description: 'MClass 삭제 성공',
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
      description: 'MClass를 찾을 수 없음',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// 실제 라우트 정의
router.get('/mclass', controller.getMClasses.bind(controller));
router.get(
  '/mclass/:id',
  validateParams(mClassIdParamSchema),
  controller.getMClass.bind(controller)
);
router.post(
  '/mclass',
  authenticateToken,
  validateBody(createMClassSchema),
  controller.createMClass.bind(controller)
);
router.put(
  '/mclass/:id',
  authenticateToken,
  validateParams(mClassIdParamSchema),
  validateBody(updateMClassSchema),
  controller.updateMClass.bind(controller)
);
router.delete(
  '/mclass/:id',
  authenticateToken,
  validateParams(mClassIdParamSchema),
  controller.deleteMClass.bind(controller)
);

export default router;
