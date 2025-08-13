import { z } from 'zod';

// 약관 유형 스키마
const termTypeSchema = z.enum(['SERVICE', 'PRIVACY', 'ENROLLMENT']);

// 약관 생성 스키마
export const createTermSchema = z
  .object({
    type: termTypeSchema,
    title: z
      .string()
      .min(1, '약관 제목은 필수입니다.')
      .max(200, '약관 제목은 200자 이하여야 합니다.')
      .trim(),
    content: z
      .string()
      .min(1, '약관 내용은 필수입니다.')
      .max(10000, '약관 내용은 10000자 이하여야 합니다.')
      .trim(),
    isRequired: z.boolean().optional().default(false),
    version: z
      .string()
      .min(1, '약관 버전은 필수입니다.')
      .max(50, '약관 버전은 50자 이하여야 합니다.')
      .trim(),
  })
  .strict();

export type CreateTermRequest = z.infer<typeof createTermSchema>;
