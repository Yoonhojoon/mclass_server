import { z } from 'zod';

// 공통 페이지네이션 스키마
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  size: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// 공통 UUID 파라미터 스키마
export const uuidParamSchema = z.object({
  id: z.string().uuid('유효한 UUID 형식이어야 합니다.'),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;
