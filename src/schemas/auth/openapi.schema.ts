import { z } from 'zod';
import { registry } from '../../config/swagger-zod.js';

// 공통 스키마
const emailSchema = z
  .string()
  .email('유효한 이메일 주소를 입력해주세요.')
  .toLowerCase()
  .trim()
  .openapi({ description: '사용자 이메일', example: 'user@example.com' });

const passwordSchema = z
  .string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
  .openapi({ description: '사용자 비밀번호', example: 'password123' });

// 사용자 역할 스키마
const userRoleSchema = z
  .enum(['USER', 'ADMIN'])
  .openapi({ description: '사용자 역할' });

// 사용자 응답 스키마
export const userResponseSchema = z.object({
  id: z.string().uuid().openapi({ description: '사용자 ID' }),
  email: z.string().email().openapi({ description: '사용자 이메일' }),
  name: z.string().openapi({ description: '사용자 이름' }),
  role: userRoleSchema,
  isAdmin: z.boolean().openapi({ description: '관리자 여부' }),
  provider: z
    .enum(['LOCAL', 'KAKAO', 'GOOGLE', 'NAVER'])
    .openapi({ description: '로그인 제공자' }),
  social_id: z.string().nullable().openapi({ description: '소셜 로그인 ID' }),
  created_at: z.string().datetime().openapi({ description: '생성일시' }),
});

// 로그인 스키마
export const loginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict()
  .openapi({ description: '로그인 요청' });

// 소셜 로그인 스키마
export const socialLoginSchema = z
  .object({
    provider: z
      .enum(['KAKAO', 'GOOGLE', 'NAVER'], {
        message: '지원하는 소셜 로그인 제공자만 사용 가능합니다.',
      })
      .openapi({ description: '소셜 로그인 제공자' }),
    accessToken: z
      .string()
      .min(1, '액세스 토큰은 필수입니다.')
      .openapi({ description: '소셜 로그인 액세스 토큰' }),
  })
  .strict()
  .openapi({ description: '소셜 로그인 요청' });

// 회원가입 완료 스키마
export const completeSignUpSchema = z
  .object({
    termIds: z
      .array(z.string().uuid('유효한 UUID 형식이어야 합니다.'))
      .min(1, '최소 하나의 약관 ID가 필요합니다.')
      .openapi({ description: '동의할 약관 ID 목록' }),
  })
  .strict()
  .openapi({ description: '회원가입 완료 요청' });

// 토큰 갱신 스키마
export const refreshTokenSchema = z
  .object({
    refreshToken: z
      .string()
      .min(1, '리프레시 토큰은 필수입니다.')
      .openapi({ description: '리프레시 토큰' }),
  })
  .strict()
  .openapi({ description: '토큰 갱신 요청' });

// 비밀번호 변경 스키마
export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema.openapi({ description: '현재 비밀번호' }),
    newPassword: passwordSchema.openapi({ description: '새 비밀번호' }),
  })
  .strict()
  .refine(data => data.currentPassword !== data.newPassword, {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    path: ['newPassword'],
  })
  .openapi({ description: '비밀번호 변경 요청' });

// 로그인 응답 스키마
export const loginResponseSchema = z.object({
  user: userResponseSchema,
  accessToken: z.string().openapi({ description: '액세스 토큰' }),
  refreshToken: z.string().openapi({ description: '리프레시 토큰' }),
});

// 회원가입 응답 스키마
export const registerResponseSchema = z.object({
  user: userResponseSchema,
  message: z.string().openapi({ description: '응답 메시지' }),
});

// 로그아웃 응답 스키마
export const logoutResponseSchema = z.object({
  message: z.string().openapi({ description: '응답 메시지' }),
});

// 스키마들을 레지스트리에 등록
registry.register('User', userResponseSchema);
registry.register('LoginRequest', loginSchema);
registry.register('SocialLoginRequest', socialLoginSchema);
registry.register('CompleteSignUpRequest', completeSignUpSchema);
registry.register('RefreshTokenRequest', refreshTokenSchema);
registry.register('ChangePasswordRequest', changePasswordSchema);
registry.register('LoginResponse', loginResponseSchema);
registry.register('RegisterResponse', registerResponseSchema);
registry.register('LogoutResponse', logoutResponseSchema);

// 타입 내보내기
export type LoginRequest = z.infer<typeof loginSchema>;
export type SocialLoginRequest = z.infer<typeof socialLoginSchema>;
export type CompleteSignUpRequest = z.infer<typeof completeSignUpSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
