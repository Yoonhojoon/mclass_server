import { z } from 'zod';

export const ListQueryDtoSchema = z.object({
  phase: z.enum(['UPCOMING', 'RECRUITING', 'IN_PROGRESS', 'ENDED']).optional(),
  selectionType: z.enum(['FIRST_COME', 'REVIEW']).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED']).default('PUBLIC'),
  page: z.coerce
    .number()
    .int()
    .positive('페이지는 1 이상이어야 합니다')
    .default(1),
  size: z.coerce
    .number()
    .int()
    .positive('페이지 크기는 1 이상이어야 합니다')
    .max(100, '페이지 크기는 100 이하여야 합니다')
    .default(20),
  sort: z.enum(['startAt', 'recruitStartAt', 'createdAt']).default('startAt'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type ListQueryDto = z.infer<typeof ListQueryDtoSchema>;
