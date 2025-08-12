import { z } from 'zod';

// 약관 동의 스키마
export const agreeToTermSchema = z
  .object({
    termId: z.string().uuid('유효한 UUID 형식이어야 합니다.'),
  })
  .strict();

export type AgreeToTermRequest = z.infer<typeof agreeToTermSchema>;

// 약관 ID 파라미터 스키마
export const termIdParamSchema = z.object({
  id: z.string().uuid('유효한 UUID 형식이어야 합니다.'),
});

export type TermIdParam = z.infer<typeof termIdParamSchema>;
