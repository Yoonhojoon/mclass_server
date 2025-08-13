import { z } from 'zod';

// EnrollmentForm ID 파라미터 스키마
export const enrollmentFormIdParamSchema = z.object({
  id: z.string().uuid('유효한 UUID 형식이어야 합니다.'),
});

export type EnrollmentFormIdParam = z.infer<typeof enrollmentFormIdParamSchema>;

// MClass ID 파라미터 스키마 (EnrollmentForm 조회용)
export const mClassIdForEnrollmentFormParamSchema = z.object({
  mclassId: z.string().uuid('유효한 UUID 형식이어야 합니다.'),
});

export type MClassIdForEnrollmentFormParam = z.infer<
  typeof mClassIdForEnrollmentFormParamSchema
>;
