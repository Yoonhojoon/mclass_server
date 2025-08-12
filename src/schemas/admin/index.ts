import { z } from 'zod';

// 사용자 권한 변경 스키마
export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'TEACHER']),
  isAdmin: z.boolean(),
  reason: z.string().optional(),
});

// 사용자 ID 파라미터 스키마
export const adminUserIdParamSchema = z.object({
  id: z.string().uuid('유효하지 않은 사용자 ID입니다.'),
});

// 응답 스키마들
export const userRoleResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['USER', 'ADMIN', 'TEACHER']),
  isAdmin: z.boolean(),
  isSignUpCompleted: z.boolean(),
  provider: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const adminCountResponseSchema = z.object({
  adminCount: z.number(),
});

export const usersListResponseSchema = z.array(userRoleResponseSchema);
