import { z } from 'zod';

// 사용자 역할 스키마
const userRoleSchema = z.enum(['USER', 'ADMIN']);

// 사용자 정보 수정 스키마
export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(1, '이름은 필수입니다.')
      .max(50, '이름은 50자 이하여야 합니다.')
      .trim()
      .optional(),
    role: userRoleSchema.optional(),
  })
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: '최소 하나의 필드를 수정해야 합니다.',
  });

export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
