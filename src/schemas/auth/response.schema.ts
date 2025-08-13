import { z } from 'zod';

// 사용자 역할 스키마
const userRoleSchema = z.enum(['USER', 'ADMIN']);

// 사용자 응답 스키마
export const userResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: userRoleSchema,
  isAdmin: z.boolean(),
  isSignUpCompleted: z.boolean(),
  provider: z.enum(['LOCAL', 'KAKAO', 'GOOGLE', 'NAVER']),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

// 로그인 응답 스키마
export const loginResponseSchema = z.object({
  user: userResponseSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

// 회원가입 응답 스키마
export const registerResponseSchema = z.object({
  user: userResponseSchema,
  message: z.string(),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;

// 로그아웃 응답 스키마
export const logoutResponseSchema = z.object({
  message: z.string(),
});

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
