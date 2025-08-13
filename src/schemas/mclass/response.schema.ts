import { z } from 'zod';

// MClass 단계 스키마
const mClassPhaseSchema = z.enum([
  'UPCOMING',
  'RECRUITING',
  'IN_PROGRESS',
  'ENDED',
]);

// MClass 응답 스키마
export const mClassResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  recruitStartAt: z.string().datetime().nullable(),
  recruitEndAt: z.string().datetime().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  selectionType: z.enum(['FIRST_COME', 'REVIEW']),
  capacity: z.number().int().nullable(),
  allowWaitlist: z.boolean(),
  waitlistCapacity: z.number().int().nullable(),
  visibility: z.enum(['PUBLIC', 'UNLISTED']),
  isOnline: z.boolean(),
  location: z.string().nullable(),
  fee: z.number().int().nullable(),
  phase: mClassPhaseSchema,
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MClassResponse = z.infer<typeof mClassResponseSchema>;

// MClass 목록 응답 스키마
export const mClassListResponseSchema = z.object({
  data: z.array(mClassResponseSchema),
  meta: z.object({
    page: z.number().int(),
    size: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type MClassListResponse = z.infer<typeof mClassListResponseSchema>;

// MClass 통계 응답 스키마
export const mClassStatisticsResponseSchema = z.object({
  approvedCount: z.number().int(),
  waitlistedCount: z.number().int(),
});

export type MClassStatisticsResponse = z.infer<
  typeof mClassStatisticsResponseSchema
>;
