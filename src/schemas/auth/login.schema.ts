import { z } from 'zod';

// 공통 스키마
const emailSchema = z
  .string()
  .email('유효한 이메일 주소를 입력해주세요.')
  .toLowerCase()
  .trim();

const passwordSchema = z
  .string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다.');

// 로그인 스키마
export const loginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export type LoginRequest = z.infer<typeof loginSchema>;

// 소셜 로그인 스키마
export const socialLoginSchema = z
  .object({
    provider: z.enum(['KAKAO', 'GOOGLE', 'NAVER'], {
      message: '지원하는 소셜 로그인 제공자만 사용 가능합니다.',
    }),
    accessToken: z.string().min(1, '액세스 토큰은 필수입니다.'),
  })
  .strict();

export type SocialLoginRequest = z.infer<typeof socialLoginSchema>;

// 회원가입 완료 스키마
export const completeSignUpSchema = z
  .object({
    name: z
      .string()
      .min(1, '이름은 필수입니다.')
      .max(50, '이름은 50자 이하여야 합니다.')
      .trim(),
    role: z.enum(['USER', 'ADMIN']).optional().default('USER'),
  })
  .strict();

export type CompleteSignUpRequest = z.infer<typeof completeSignUpSchema>;

// 토큰 갱신 스키마
export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1, '리프레시 토큰은 필수입니다.'),
  })
  .strict();

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

// 비밀번호 변경 스키마
export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  })
  .strict()
  .refine(data => data.currentPassword !== data.newPassword, {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    path: ['newPassword'],
  });

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
