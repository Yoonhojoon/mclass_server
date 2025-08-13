import { z } from 'zod';

// 약관 수정 스키마
export const updateTermSchema = z
  .object({
    title: z
      .string()
      .min(1, '약관 제목은 필수입니다.')
      .max(200, '약관 제목은 200자 이하여야 합니다.')
      .trim()
      .optional(),
    content: z
      .string()
      .min(1, '약관 내용은 필수입니다.')
      .max(10000, '약관 내용은 10000자 이하여야 합니다.')
      .trim()
      .optional(),
    isRequired: z.boolean().optional(),
    version: z
      .string()
      .min(1, '약관 버전은 필수입니다.')
      .max(50, '약관 버전은 50자 이하여야 합니다.')
      .trim()
      .optional(),
  })
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: '최소 하나의 필드를 수정해야 합니다.',
  });

export type UpdateTermRequest = z.infer<typeof updateTermSchema>;
