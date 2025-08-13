import { z } from 'zod';

// 약관 유형 스키마
const termTypeSchema = z.enum(['SERVICE', 'PRIVACY', 'ENROLLMENT']);

// 약관 응답 스키마
export const termResponseSchema = z.object({
  id: z.string().uuid(),
  type: termTypeSchema,
  title: z.string(),
  content: z.string(),
  is_required: z.boolean(),
  version: z.string(),
  created_at: z.string().datetime(),
});

export type TermResponse = z.infer<typeof termResponseSchema>;

// 약관 목록 응답 스키마
export const termListResponseSchema = z.object({
  data: z.array(termResponseSchema),
  message: z.string(),
});

export type TermListResponse = z.infer<typeof termListResponseSchema>;

// 사용자 약관 동의 응답 스키마
export const userTermAgreementResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  termId: z.string().uuid(),
  agreedAt: z.string().datetime(),
});

export type UserTermAgreementResponse = z.infer<
  typeof userTermAgreementResponseSchema
>;
