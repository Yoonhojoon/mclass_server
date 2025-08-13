import { z } from 'zod';
import { QuestionSchema } from './create.schema.js';

export const UpdateEnrollmentFormSchema = z
  .object({
    title: z
      .string()
      .min(1, '지원서 제목은 필수입니다')
      .max(200, '지원서 제목은 200자 이하여야 합니다')
      .optional(),
    description: z
      .string()
      .max(1000, '지원서 설명은 1000자 이하여야 합니다')
      .nullable()
      .optional(),
    questions: z
      .array(QuestionSchema)
      .min(1, '최소 1개 이상의 질문이 필요합니다')
      .max(50, '질문은 최대 50개까지 가능합니다')
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: '최소 하나의 필드를 수정해야 합니다.',
  });

export type UpdateEnrollmentFormRequest = z.infer<
  typeof UpdateEnrollmentFormSchema
>;

// DTO 타입으로도 export (기존 DTO와 호환성 유지)
export type UpdateEnrollmentFormDto = z.infer<
  typeof UpdateEnrollmentFormSchema
>;
