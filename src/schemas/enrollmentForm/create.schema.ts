import { z } from 'zod';

// 질문 타입 정의
export const QuestionSchema = z.object({
  id: z.string().min(1, '질문 ID는 필수입니다'),
  type: z.enum(
    [
      'text',
      'email',
      'phone',
      'date',
      'radio',
      'checkbox',
      'agreeTerms', // 약관 동의용 체크박스
      'textarea',
      'select',
    ],
    {
      message: '지원하지 않는 질문 타입입니다',
    }
  ),
  label: z.string().min(1, '질문 라벨은 필수입니다'),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // radio, checkbox, select용
  placeholder: z.string().optional(),
  validation: z
    .object({
      minLength: z.number().positive().optional(),
      maxLength: z.number().positive().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});

export const CreateEnrollmentFormSchema = z.object({
  title: z
    .string()
    .min(1, '지원서 제목은 필수입니다')
    .max(200, '지원서 제목은 200자 이하여야 합니다'),
  description: z
    .string()
    .max(1000, '지원서 설명은 1000자 이하여야 합니다')
    .nullable()
    .optional(),
  questions: z
    .array(QuestionSchema)
    .min(1, '최소 1개 이상의 질문이 필요합니다')
    .max(50, '질문은 최대 50개까지 가능합니다'),
  isActive: z.boolean().default(true),
});

export type CreateEnrollmentFormRequest = z.infer<
  typeof CreateEnrollmentFormSchema
>;

// DTO 타입으로도 export (기존 DTO와 호환성 유지)
export type CreateEnrollmentFormDto = z.infer<
  typeof CreateEnrollmentFormSchema
>;
export type Question = z.infer<typeof QuestionSchema>;
