import { z } from 'zod';
import { paginationQuerySchema } from '../common/pagination.schema.js';

// MClass 조회 쿼리 스키마
export const mClassListQuerySchema = paginationQuerySchema.extend({
  phase: z.enum(['UPCOMING', 'RECRUITING', 'IN_PROGRESS', 'ENDED']).optional(),
  selectionType: z.enum(['FIRST_COME', 'REVIEW']).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED']).default('PUBLIC'),
  sort: z.enum(['startAt', 'recruitStartAt', 'createdAt']).default('startAt'),
});

export type MClassListQuery = z.infer<typeof mClassListQuerySchema>;

// MClass ID 파라미터 스키마
export const mClassIdParamSchema = z.object({
  id: z.string().uuid('유효한 UUID 형식이어야 합니다.'),
});

export type MClassIdParam = z.infer<typeof mClassIdParamSchema>;
