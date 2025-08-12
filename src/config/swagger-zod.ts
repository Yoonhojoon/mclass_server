import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Zod를 OpenAPI와 확장
extendZodWithOpenApi(z);

// OpenAPI 레지스트리 생성
export const registry = new OpenAPIRegistry();

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
  servers: [
    {
      url: 'http://localhost:3000',
      description: '로컬 개발 서버',
    },
    {
      url: 'https://mclass-alb-616483239.ap-northeast-2.elb.amazonaws.com',
      description: '프로덕션 서버',
    },
  ],
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
) =>
  z.object({
    success: z.boolean().openapi({ example: true }),
    data: z.array(dataSchema),
    meta: PaginationMetaSchema,
  });

// 스키마들을 레지스트리에 등록
registry.register('SuccessResponse', SuccessResponseSchema);
registry.register('ErrorResponse', ErrorResponseSchema);
registry.register('PaginationMeta', PaginationMetaSchema);
