import { z } from 'zod';

// 질문 응답 스키마
export const questionResponseSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'email',
    'phone',
    'date',
    'radio',
    'checkbox',
    'agreeTerms',
    'textarea',
    'select',
  ]),
  label: z.string(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  validation: z
    .object({
      minLength: z.number().positive().optional(),
      maxLength: z.number().positive().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});

export type QuestionResponse = z.infer<typeof questionResponseSchema>;

// EnrollmentForm 응답 스키마
export const enrollmentFormResponseSchema = z.object({
  id: z.string().uuid(),
  mclassId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  questions: z.array(questionResponseSchema),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type EnrollmentFormResponse = z.infer<
  typeof enrollmentFormResponseSchema
>;

// 기존 DTO와 호환성을 위한 interface도 export
export interface EnrollmentFormResponseInterface {
  id: string;
  mclassId: string;
  title: string;
  description: string | null;
  questions: QuestionResponse[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
