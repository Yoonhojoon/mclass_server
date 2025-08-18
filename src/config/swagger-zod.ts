import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Zod를 OpenAPI와 확장
extendZodWithOpenApi(z);

// OpenAPI 레지스트리 생성
export const registry = new OpenAPIRegistry();

// 환경별 서버 URL 설정
const getServerUrls = (): Array<{ url: string; description: string }> => {
  const servers = [];

  // 프로덕션 환경
  if (process.env.NODE_ENV === 'production') {
    // API_BASE_URL이 설정되어 있으면 절대 경로 사용
    if (process.env.API_BASE_URL) {
      servers.push({
        url: process.env.API_BASE_URL,
        description: '프로덕션 서버',
      });
    } else {
      // API_BASE_URL이 없으면 상대 경로 사용
      servers.push({
        url: '/api',
        description: '프로덕션 서버 (상대 경로)',
      });
    }
  }

  // 스테이징 환경
  else if (process.env.NODE_ENV === 'staging') {
    if (process.env.API_BASE_URL) {
      servers.push({
        url: process.env.API_BASE_URL,
        description: '스테이징 서버',
      });
    } else if (process.env.STAGING_URL) {
      servers.push({
        url: process.env.STAGING_URL,
        description: '스테이징 서버',
      });
    } else {
      servers.push({
        url: '/api',
        description: '스테이징 서버 (상대 경로)',
      });
    }
  }

  // 로컬 개발 환경
  else {
    servers.push({
      url: process.env.LOCAL_URL || 'http://localhost:3000',
      description: '로컬 개발 서버',
    });
  }

  // 디버깅을 위한 로그
  console.log(`🔧 Swagger 서버 URL 설정:`);
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`  - API_BASE_URL: ${process.env.API_BASE_URL || 'not set'}`);
  console.log(`  - ALB_DNS_NAME: ${process.env.ALB_DNS_NAME || 'not set'}`);
  console.log(
    `  - 설정된 서버들:`,
    servers.map(s => `${s.url} (${s.description})`)
  );

  return servers;
};

// 기본 OpenAPI 문서 설정
export const openApiConfig = {
  openapi: '3.0.0',
  info: {
    title: 'MClass Server API',
    version: '1.0.0',
    description: 'MClass 서버 API 문서',
    contact: {
      name: 'API Support',
      email: 'support@mclass.com',
    },
  },
  servers: getServerUrls(),
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT 토큰을 입력하세요. 예: Bearer <token>',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// 공통 응답 스키마들
export const SuccessResponseSchema = z.object({
  success: z.boolean().openapi({ example: true, description: '성공 여부' }),
  data: z.any().openapi({ description: '응답 데이터' }),
  message: z.string().optional().openapi({ description: '성공 메시지' }),
  code: z
    .string()
    .optional()
    .openapi({ example: 'SUCCESS', description: '성공 코드' }),
});

export const ErrorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false, description: '성공 여부' }),
  error: z.object({
    code: z.string().openapi({ description: '에러 코드' }),
    message: z.string().openapi({ description: '에러 메시지' }),
    details: z.any().optional().openapi({ description: '상세 에러 정보' }),
  }),
});

// HTTP 상태 코드별 구체적인 에러 스키마들
export const BadRequestErrorSchema = ErrorResponseSchema.extend({
  error: z.object({
    code: z.string().openapi({
      example: 'VALIDATION_ERROR',
      description: '에러 코드',
    }),
    message: z.string().openapi({
      example: '입력 데이터가 유효하지 않습니다.',
      description: '에러 메시지',
    }),
    details: z
      .any()
      .optional()
      .openapi({
        example: { field: 'email', issue: '이메일 형식이 올바르지 않습니다.' },
        description: '상세 에러 정보',
      }),
  }),
});

export const UnauthorizedErrorSchema = ErrorResponseSchema.extend({
  error: z.object({
    code: z.string().openapi({
      example: 'INVALID_CREDENTIALS',
      description: '에러 코드',
    }),
    message: z.string().openapi({
      example: '이메일 또는 비밀번호가 올바르지 않습니다.',
      description: '에러 메시지',
    }),
    details: z
      .any()
      .optional()
      .openapi({
        example: { reason: 'INVALID_PASSWORD' },
        description: '상세 에러 정보',
      }),
  }),
});

export const ForbiddenErrorSchema = ErrorResponseSchema.extend({
  error: z.object({
    code: z.string().openapi({
      example: 'INSUFFICIENT_PERMISSIONS',
      description: '에러 코드',
    }),
    message: z.string().openapi({
      example: '이 작업을 수행할 권한이 없습니다.',
      description: '에러 메시지',
    }),
    details: z
      .any()
      .optional()
      .openapi({
        example: { requiredRole: 'ADMIN', currentRole: 'USER' },
        description: '상세 에러 정보',
      }),
  }),
});

export const NotFoundErrorSchema = ErrorResponseSchema.extend({
  error: z.object({
    code: z.string().openapi({
      example: 'RESOURCE_NOT_FOUND',
      description: '에러 코드',
    }),
    message: z.string().openapi({
      example: '요청한 리소스를 찾을 수 없습니다.',
      description: '에러 메시지',
    }),
    details: z
      .any()
      .optional()
      .openapi({
        example: { resource: 'user', id: '123' },
        description: '상세 에러 정보',
      }),
  }),
});

export const ConflictErrorSchema = ErrorResponseSchema.extend({
  error: z.object({
    code: z.string().openapi({
      example: 'RESOURCE_ALREADY_EXISTS',
      description: '에러 코드',
    }),
    message: z.string().openapi({
      example: '이미 존재하는 리소스입니다.',
      description: '에러 메시지',
    }),
    details: z
      .any()
      .optional()
      .openapi({
        example: { field: 'email', value: 'user@example.com' },
        description: '상세 에러 정보',
      }),
  }),
});

export const InternalServerErrorSchema = ErrorResponseSchema.extend({
  error: z.object({
    code: z.string().openapi({
      example: 'INTERNAL_SERVER_ERROR',
      description: '에러 코드',
    }),
    message: z.string().openapi({
      example: '서버 내부 오류가 발생했습니다.',
      description: '에러 메시지',
    }),
    details: z
      .any()
      .optional()
      .openapi({
        example: { timestamp: '2025-01-15T10:00:00.000Z' },
        description: '상세 에러 정보',
      }),
  }),
});

// 페이지네이션 메타 스키마
export const PaginationMetaSchema = z.object({
  page: z.number().openapi({ example: 1, description: '현재 페이지' }),
  size: z.number().openapi({ example: 20, description: '페이지 크기' }),
  total: z.number().openapi({ example: 100, description: '전체 항목 수' }),
  totalPages: z.number().openapi({ example: 5, description: '전체 페이지 수' }),
});

// 페이지네이션 응답 스키마
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
): z.ZodObject<{
  success: z.ZodBoolean;
  data: z.ZodArray<T>;
  meta: typeof PaginationMetaSchema;
}> =>
  z.object({
    success: z.boolean().openapi({ example: true }),
    data: z.array(dataSchema),
    meta: PaginationMetaSchema,
  });

// 스키마들을 레지스트리에 등록
registry.register('SuccessResponse', SuccessResponseSchema);
registry.register('ErrorResponse', ErrorResponseSchema);
registry.register('BadRequestError', BadRequestErrorSchema);
registry.register('UnauthorizedError', UnauthorizedErrorSchema);
registry.register('ForbiddenError', ForbiddenErrorSchema);
registry.register('NotFoundError', NotFoundErrorSchema);
registry.register('ConflictError', ConflictErrorSchema);
registry.register('InternalServerError', InternalServerErrorSchema);
registry.register('PaginationMeta', PaginationMetaSchema);
