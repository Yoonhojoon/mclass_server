import { z } from 'zod';

// 사용자 역할 스키마
const userRoleSchema = z.enum(['USER', 'ADMIN']);

// 일반 사용자 프로필 수정 스키마 (role 필드 제외)
export const updateUserProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, '이름은 필수입니다.')
      .max(50, '이름은 50자 이하여야 합니다.')
      .optional(),
  })
  .strict()
  .refine(data => Object.values(data).some(v => v !== undefined), {
    message: '최소 하나의 필드를 수정해야 합니다.',
  });

// 관리자 전용 사용자 역할 수정 스키마
export const adminUpdateUserRoleSchema = z
  .object({
    role: userRoleSchema,
  })
  .strict();

export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
export type AdminUpdateUserRoleRequest = z.infer<
  typeof adminUpdateUserRoleSchema
>;
