import { z } from 'zod';

// 성공 응답 스키마
export const successResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
): z.ZodObject<{
  success: z.ZodLiteral<true>;
  data: T;
  message: z.ZodOptional<z.ZodString>;
  code: z.ZodOptional<z.ZodString>;
}> =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
    code: z.string().optional(),
  });

export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
  code?: string;
};

// 에러 응답 스키마
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// 페이지네이션 메타 스키마
export const paginationMetaSchema = z.object({
  page: z.number().int(),
  size: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

// 페이지네이션 응답 스키마
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
): z.ZodObject<{
  success: z.ZodLiteral<true>;
  data: z.ZodArray<T>;
  meta: typeof paginationMetaSchema;
  message: z.ZodOptional<z.ZodString>;
}> =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    meta: paginationMetaSchema,
    message: z.string().optional(),
  });

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  meta: PaginationMeta;
  message?: string;
};
