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
    device: z.string().optional(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
  })
  .strict();

export type LoginDto = z.infer<typeof loginSchema>;

// 회원가입 스키마
export const registerSchema = z
  .object({
    email: emailSchema,
    name: z
      .string()
      .min(1, '이름은 필수입니다.')
      .max(50, '이름은 50자 이하여야 합니다.')
      .trim(),
    password: passwordSchema,
    device: z.string().optional(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
  })
  .strict();

export type RegisterDto = z.infer<typeof registerSchema>;

// 소셜 로그인 스키마 (discriminated union)
const kakaoProfileSchema = z
  .object({
    provider: z.literal('kakao'),
    email: emailSchema,
    kakaoId: z.string().min(1, '카카오 ID는 필수입니다.'),
    name: z.string().optional(),
    device: z.string().optional(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
  })
  .strict();

const googleProfileSchema = z
  .object({
    provider: z.literal('google'),
    email: emailSchema,
    sub: z.string().min(1, 'Google ID는 필수입니다.'),
    name: z.string().optional(),
    device: z.string().optional(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
  })
  .strict();

export const socialLoginSchema = z.discriminatedUnion('provider', [
  kakaoProfileSchema,
  googleProfileSchema,
]);

export type SocialLoginDto = z.infer<typeof socialLoginSchema>;

// 약관 동의 완료 스키마
export const completeSignUpSchema = z
  .object({
    termIds: z
      .array(z.string().uuid('유효한 UUID 형식이어야 합니다.'))
      .min(1, '최소 하나의 약관 ID가 필요합니다.'),
  })
  .strict();

export type CompleteSignUpDto = z.infer<typeof completeSignUpSchema>;

// 토큰 갱신 스키마
export const refreshTokenSchema = z
  .object({
    refreshToken: z
      .string()
      .min(20, 'Refresh Token은 최소 20자 이상이어야 합니다.'),
  })
  .strict();

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

// 비밀번호 변경 스키마
const passwordWithValidationSchema = z
  .string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
  .refine(
    password => /^(?=.*[A-Za-z])(?=.*\d)/.test(password),
    '비밀번호는 영문과 숫자를 포함해야 합니다.'
  );

export const changePasswordSchema = z
  .object({
    currentPassword: passwordWithValidationSchema,
    newPassword: passwordWithValidationSchema,
  })
  .strict();

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
