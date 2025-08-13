import { z } from 'zod';
import { registry } from '../../config/swagger-zod.js';

// 약관 유형 스키마
const termTypeSchema = z
  .enum(['SERVICE', 'PRIVACY', 'ENROLLMENT'])
  .openapi({ description: '약관 유형' });

// 약관 응답 스키마
export const termResponseSchema = z.object({
  id: z.string().uuid().openapi({ description: '약관 ID' }),
  type: termTypeSchema,
  title: z
    .string()
    .openapi({ description: '약관 제목', example: '서비스 이용약관' }),
  content: z.string().openapi({ description: '약관 내용' }),
  isRequired: z.boolean().openapi({ description: '필수 동의 여부' }),
  version: z.string().openapi({ description: '약관 버전', example: '1.0.0' }),
  createdAt: z.string().datetime().openapi({ description: '생성일시' }),
});

// 약관 생성 스키마
export const createTermSchema = z
  .object({
    type: termTypeSchema,
    title: z
      .string()
      .min(1, '약관 제목은 필수입니다.')
      .max(200, '약관 제목은 200자 이하여야 합니다.')
      .trim()
      .openapi({
        description: '약관 제목 (1-200자)',
        example: '서비스 이용약관',
      }),
    content: z
      .string()
      .min(1, '약관 내용은 필수입니다.')
      .max(10000, '약관 내용은 10000자 이하여야 합니다.')
      .trim()
      .openapi({ description: '약관 내용 (1-10000자)' }),
    isRequired: z
      .boolean()
      .optional()
      .default(false)
      .openapi({ description: '필수 동의 여부' }),
    version: z
      .string()
      .min(1, '약관 버전은 필수입니다.')
      .max(50, '약관 버전은 50자 이하여야 합니다.')
      .trim()
      .openapi({ description: '약관 버전 (1-50자)', example: '1.0.0' }),
  })
  .strict()
  .openapi({ description: '약관 생성 요청' });

// 약관 수정 스키마
export const updateTermSchema = z
  .object({
    type: termTypeSchema.optional(),
    title: z
      .string()
      .min(1, '약관 제목은 필수입니다.')
      .max(200, '약관 제목은 200자 이하여야 합니다.')
      .trim()
      .optional()
      .openapi({ description: '약관 제목 (1-200자)' }),
    content: z
      .string()
      .min(1, '약관 내용은 필수입니다.')
      .max(10000, '약관 내용은 10000자 이하여야 합니다.')
      .trim()
      .optional()
      .openapi({ description: '약관 내용 (1-10000자)' }),
    isRequired: z
      .boolean()
      .optional()
      .openapi({ description: '필수 동의 여부' }),
    version: z
      .string()
      .min(1, '약관 버전은 필수입니다.')
      .max(50, '약관 버전은 50자 이하여야 합니다.')
      .trim()
      .optional()
      .openapi({ description: '약관 버전 (1-50자)' }),
  })
  .strict()
  .openapi({ description: '약관 수정 요청' });

// 약관 동의 스키마
export const agreeToTermSchema = z
  .object({
    termId: z
      .string()
      .uuid('유효한 UUID 형식이어야 합니다.')
      .openapi({ description: '약관 ID' }),
  })
  .strict()
  .openapi({ description: '약관 동의 요청' });

// 약관 목록 응답 스키마
export const termListResponseSchema = z.object({
  data: z.array(termResponseSchema),
  message: z.string().openapi({ description: '응답 메시지' }),
});

// 사용자 약관 동의 응답 스키마
export const userTermAgreementResponseSchema = z.object({
  id: z.string().uuid().openapi({ description: '동의 기록 ID' }),
  userId: z.string().uuid().openapi({ description: '사용자 ID' }),
  termId: z.string().uuid().openapi({ description: '약관 ID' }),
  agreedAt: z.string().datetime().openapi({ description: '동의일시' }),
});

// 스키마들을 레지스트리에 등록
registry.register('Term', termResponseSchema);
registry.register('CreateTermRequest', createTermSchema);
registry.register('UpdateTermRequest', updateTermSchema);
registry.register('AgreeToTermRequest', agreeToTermSchema);
registry.register('TermListResponse', termListResponseSchema);
registry.register('UserTermAgreement', userTermAgreementResponseSchema);

// 타입 내보내기
export type CreateTermRequest = z.infer<typeof createTermSchema>;
export type UpdateTermRequest = z.infer<typeof updateTermSchema>;
export type AgreeToTermRequest = z.infer<typeof agreeToTermSchema>;
export type TermResponse = z.infer<typeof termResponseSchema>;
export type TermListResponse = z.infer<typeof termListResponseSchema>;
export type UserTermAgreementResponse = z.infer<
  typeof userTermAgreementResponseSchema
>;
