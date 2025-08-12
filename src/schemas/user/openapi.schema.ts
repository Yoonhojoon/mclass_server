import { z } from 'zod';
import { registry } from '../../config/swagger-zod.js';

// 사용자 역할 스키마
const userRoleSchema = z
  .enum(['USER', 'ADMIN'])
  .openapi({ description: '사용자 역할' });

// 사용자 정보 수정 스키마
export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(1, '이름은 필수입니다.')
      .max(50, '이름은 50자 이하여야 합니다.')
      .trim()
      .optional()
      .openapi({ description: '사용자 이름 (1-50자)', example: '홍길동' }),
    role: userRoleSchema.optional().openapi({ description: '사용자 역할' }),
  })
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: '최소 하나의 필드를 수정해야 합니다.',
  })
  .openapi({ description: '사용자 정보 수정 요청' });

// 사용자 ID 파라미터 스키마
export const userIdParamSchema = z
  .object({
    id: z
      .string()
      .uuid('유효한 UUID 형식이어야 합니다.')
      .openapi({ description: '사용자 ID' }),
  })
  .openapi({ description: '사용자 ID 파라미터' });

// 사용자 이메일 쿼리 스키마
export const getUserByEmailSchema = z
  .object({
    email: z
      .string()
      .email('유효한 이메일 주소를 입력해주세요.')
      .toLowerCase()
      .trim()
      .openapi({ description: '사용자 이메일', example: 'user@example.com' }),
  })
  .openapi({ description: '이메일로 사용자 조회 쿼리' });

// 사용자 프로필 응답 스키마
export const userProfileResponseSchema = z.object({
  id: z.string().uuid().openapi({ description: '사용자 ID' }),
  email: z.string().email().openapi({ description: '사용자 이메일' }),
  name: z.string().openapi({ description: '사용자 이름' }),
  role: userRoleSchema,
  isAdmin: z.boolean().openapi({ description: '관리자 여부' }),
  isSignUpCompleted: z.boolean().openapi({ description: '회원가입 완료 여부' }),
  provider: z
    .enum(['LOCAL', 'KAKAO', 'GOOGLE', 'NAVER'])
    .openapi({ description: '로그인 제공자' }),
  social_id: z.string().nullable().openapi({ description: '소셜 로그인 ID' }),
  created_at: z.string().datetime().openapi({ description: '생성일시' }),
});

// 스키마들을 레지스트리에 등록
registry.register('UpdateUserRequest', updateUserSchema);
registry.register('UserIdParam', userIdParamSchema);
registry.register('GetUserByEmailQuery', getUserByEmailSchema);
registry.register('UserProfile', userProfileResponseSchema);

// 타입 내보내기
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type GetUserByEmailQuery = z.infer<typeof getUserByEmailSchema>;
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
