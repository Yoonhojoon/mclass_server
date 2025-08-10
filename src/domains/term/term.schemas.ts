import { z } from 'zod';

// 공통 스키마
const uuidSchema = z.string().uuid('유효한 UUID 형식이어야 합니다.');

// 약관 유형 스키마
const termTypeSchema = z.enum(['SERVICE', 'PRIVACY', 'ENROLLMENT'], {
  errorMap: () => ({
    message: '약관 유형은 SERVICE, PRIVACY, ENROLLMENT 중 하나여야 합니다.',
  }),
});

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

export type CreateTermDto = z.infer<typeof createTermSchema>;

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

export type UpdateTermDto = z.infer<typeof updateTermSchema>;

// 약관 조회 스키마 (쿼리 파라미터)
export const getTermsSchema = z
  .object({
    type: termTypeSchema.optional(),
    isRequired: z
      .string()
      .transform(val => val === 'true')
      .optional(),
    page: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(
        val => !isNaN(val) && val > 0,
        '페이지 번호는 1 이상의 정수여야 합니다.'
      )
      .optional()
      .default('1'),
    limit: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(
        val => !isNaN(val) && val > 0 && val <= 100,
        '페이지 크기는 1-100 사이의 정수여야 합니다.'
      )
      .optional()
      .default('10'),
  })
  .strict();

export type GetTermsDto = z.infer<typeof getTermsSchema>;

// 약관 동의 스키마
export const agreeToTermSchema = z
  .object({
    termId: uuidSchema,
  })
  .strict();

export type AgreeToTermDto = z.infer<typeof agreeToTermSchema>;

// 약관 ID 파라미터 스키마
export const termIdParamSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export type TermIdParamDto = z.infer<typeof termIdParamSchema>;

// 약관 검색 스키마
export const searchTermsSchema = z
  .object({
    query: z
      .string()
      .min(1, '검색어는 필수입니다.')
      .max(100, '검색어는 100자 이하여야 합니다.')
      .trim(),
    type: termTypeSchema.optional(),
    page: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(
        val => !isNaN(val) && val > 0,
        '페이지 번호는 1 이상의 정수여야 합니다.'
      )
      .optional()
      .default('1'),
    limit: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(
        val => !isNaN(val) && val > 0 && val <= 100,
        '페이지 크기는 1-100 사이의 정수여야 합니다.'
      )
      .optional()
      .default('10'),
  })
  .strict();

export type SearchTermsDto = z.infer<typeof searchTermsSchema>;
