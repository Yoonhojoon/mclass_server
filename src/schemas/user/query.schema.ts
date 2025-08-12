import { z } from 'zod';

// 사용자 ID 파라미터 스키마
export const userIdParamSchema = z.object({
  id: z.string().uuid('유효한 UUID 형식이어야 합니다.'),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

// 사용자 이메일 쿼리 스키마
export const getUserByEmailSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력해주세요.')
    .toLowerCase()
    .trim(),
});

export type GetUserByEmailQuery = z.infer<typeof getUserByEmailSchema>;
