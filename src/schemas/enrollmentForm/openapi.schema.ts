import { z } from 'zod';
import { registry } from '../../config/swagger-zod.js';

// 질문 타입 정의
export const QuestionSchema = z.object({
  id: z
    .string()
    .min(1, '질문 ID는 필수입니다')
    .openapi({ description: '질문 ID' }),
  type: z
    .enum(
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
    )
    .openapi({ description: '질문 타입' }),
  label: z
    .string()
    .min(1, '질문 라벨은 필수입니다')
    .openapi({ description: '질문 라벨', example: '이름을 입력해주세요' }),
  required: z.boolean().default(false).openapi({ description: '필수 여부' }),
  options: z
    .array(z.string())
    .optional()
    .openapi({ description: '선택 옵션 (radio, checkbox, select 타입용)' }),
  placeholder: z.string().optional().openapi({ description: '플레이스홀더' }),
  validation: z
    .object({
      minLength: z
        .number()
        .positive()
        .optional()
        .openapi({ description: '최소 길이' }),
      maxLength: z
        .number()
        .positive()
        .optional()
        .openapi({ description: '최대 길이' }),
      pattern: z.string().optional().openapi({ description: '정규식 패턴' }),
    })
    .optional()
    .openapi({ description: '검증 규칙' }),
});

// 질문 응답 스키마
export const questionResponseSchema = z.object({
  id: z.string().openapi({ description: '질문 ID' }),
  type: z
    .enum([
      'text',
      'email',
      'phone',
      'date',
      'radio',
      'checkbox',
      'agreeTerms',
      'textarea',
      'select',
    ])
    .openapi({ description: '질문 타입' }),
  label: z.string().openapi({ description: '질문 라벨' }),
  required: z.boolean().openapi({ description: '필수 여부' }),
  options: z.array(z.string()).optional().openapi({ description: '선택 옵션' }),
  placeholder: z.string().optional().openapi({ description: '플레이스홀더' }),
  validation: z
    .object({
      minLength: z
        .number()
        .positive()
        .optional()
        .openapi({ description: '최소 길이' }),
      maxLength: z
        .number()
        .positive()
        .optional()
        .openapi({ description: '최대 길이' }),
      pattern: z.string().optional().openapi({ description: '정규식 패턴' }),
    })
    .optional()
    .openapi({ description: '검증 규칙' }),
});

// EnrollmentForm 응답 스키마
export const enrollmentFormResponseSchema = z.object({
  id: z.string().uuid().openapi({ description: '지원서 양식 ID' }),
  mclassId: z.string().uuid().openapi({ description: 'MClass ID' }),
  title: z
    .string()
    .openapi({ description: '지원서 제목', example: 'JavaScript 강의 지원서' }),
  description: z.string().nullable().openapi({ description: '지원서 설명' }),
  questions: z
    .array(questionResponseSchema)
    .openapi({ description: '질문 목록' }),
  isActive: z.boolean().openapi({ description: '활성화 여부' }),
  createdAt: z.string().datetime().openapi({ description: '생성일시' }),
  updatedAt: z.string().datetime().openapi({ description: '수정일시' }),
});

// EnrollmentForm 생성 스키마
export const CreateEnrollmentFormSchema = z
  .object({
    title: z
      .string()
      .min(1, '지원서 제목은 필수입니다')
      .max(200, '지원서 제목은 200자 이하여야 합니다')
      .openapi({
        description: '지원서 제목 (1-200자)',
        example: 'JavaScript 강의 지원서',
      }),
    description: z
      .string()
      .max(1000, '지원서 설명은 1000자 이하여야 합니다')
      .nullable()
      .optional()
      .openapi({ description: '지원서 설명 (최대 1000자)' }),
    questions: z
      .array(QuestionSchema)
      .min(1, '최소 1개 이상의 질문이 필요합니다')
      .max(50, '질문은 최대 50개까지 가능합니다')
      .openapi({ description: '질문 목록 (1-50개)' }),
    isActive: z.boolean().default(true).openapi({ description: '활성화 여부' }),
  })
  .openapi({ description: '지원서 양식 생성 요청' });

// EnrollmentForm 수정 스키마
export const UpdateEnrollmentFormSchema = z
  .object({
    title: z
      .string()
      .min(1, '지원서 제목은 필수입니다')
      .max(200, '지원서 제목은 200자 이하여야 합니다')
      .optional()
      .openapi({ description: '지원서 제목 (1-200자)' }),
    description: z
      .string()
      .max(1000, '지원서 설명은 1000자 이하여야 합니다')
      .nullable()
      .optional()
      .openapi({ description: '지원서 설명 (최대 1000자)' }),
    questions: z
      .array(QuestionSchema)
      .min(1, '최소 1개 이상의 질문이 필요합니다')
      .max(50, '질문은 최대 50개까지 가능합니다')
      .optional()
      .openapi({ description: '질문 목록 (1-50개)' }),
    isActive: z.boolean().optional().openapi({ description: '활성화 여부' }),
  })
  .openapi({ description: '지원서 양식 수정 요청' });

// EnrollmentForm 조회 쿼리 스키마
export const EnrollmentFormQuerySchema = z
  .object({
    mclassId: z
      .string()
      .uuid()
      .optional()
      .openapi({ description: 'MClass ID 필터' }),
    isActive: z
      .boolean()
      .optional()
      .openapi({ description: '활성화 여부 필터' }),
    page: z
      .number()
      .int()
      .min(1)
      .default(1)
      .openapi({ description: '페이지 번호', example: 1 }),
    size: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .openapi({ description: '페이지 크기 (최대 100)', example: 20 }),
  })
  .openapi({ description: '지원서 양식 조회 쿼리' });

// 스키마들을 레지스트리에 등록
registry.register('Question', QuestionSchema);
registry.register('QuestionResponse', questionResponseSchema);
registry.register('EnrollmentForm', enrollmentFormResponseSchema);
registry.register('CreateEnrollmentFormRequest', CreateEnrollmentFormSchema);
registry.register('UpdateEnrollmentFormRequest', UpdateEnrollmentFormSchema);
registry.register('EnrollmentFormQuery', EnrollmentFormQuerySchema);

// 타입 내보내기
export type CreateEnrollmentFormRequest = z.infer<
  typeof CreateEnrollmentFormSchema
>;
export type UpdateEnrollmentFormRequest = z.infer<
  typeof UpdateEnrollmentFormSchema
>;
export type EnrollmentFormQuery = z.infer<typeof EnrollmentFormQuerySchema>;
export type QuestionResponse = z.infer<typeof questionResponseSchema>;
export type EnrollmentFormResponse = z.infer<
  typeof enrollmentFormResponseSchema
>;
