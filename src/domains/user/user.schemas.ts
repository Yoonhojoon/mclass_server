import { z } from 'zod';

// 공통 스키마
const uuidSchema = z.string().uuid('유효한 UUID 형식이어야 합니다.');
const emailSchema = z
  .string()
  .email('유효한 이메일 주소를 입력해주세요.')
  .toLowerCase()
  .trim();

// 사용자 역할 스키마
const userRoleSchema = z.enum(['USER', 'ADMIN']);

// 사용자 정보 수정 스키마 (role 필드 제외)
export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(1, '이름은 필수입니다.')
      .max(50, '이름은 50자 이하여야 합니다.')
      .trim()
      .optional(),
  })
  .strict()
  .refine(data => Object.values(data).some(v => v !== undefined), {
    message: '최소 하나의 필드를 수정해야 합니다.',
  });

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

// 사용자 프로필 조회 스키마 (인증된 사용자용)
export const getUserProfileSchema = z.object({}).strict();

export type GetUserProfileDto = z.infer<typeof getUserProfileSchema>;

// 사용자 ID로 조회 스키마 (파라미터)
export const getUserByIdSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export type GetUserByIdDto = z.infer<typeof getUserByIdSchema>;

// 이메일로 사용자 조회 스키마 (쿼리 파라미터)
export const getUserByEmailSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export type GetUserByEmailDto = z.infer<typeof getUserByEmailSchema>;

// 사용자 검색 스키마
export const searchUsersSchema = z
  .object({
    query: z
      .string()
      .min(1, '검색어는 필수입니다.')
      .max(100, '검색어는 100자 이하여야 합니다.')
      .trim(),
    role: userRoleSchema.optional(),
    page: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(
        val => !isNaN(val) && val > 0,
        '페이지 번호는 1 이상의 정수여야 합니다.'
      )
      .optional()
      .default(1),
    limit: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(
        val => !isNaN(val) && val > 0 && val <= 100,
        '페이지 크기는 1-100 사이의 정수여야 합니다.'
      )
      .optional()
      .default(10),
  })
  .strict();

export type SearchUsersDto = z.infer<typeof searchUsersSchema>;

// 사용자 목록 조회 스키마 (관리자용)
export const getUsersSchema = z
  .object({
    role: userRoleSchema.optional(),
    isActive: z
      .string()
      .transform(val => val === 'true')
      .optional(),
    page: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(
        val => !isNaN(val) && val > 0,
        '페이지 번호는 1 이상의 정수여야 합니다.'
      )
      .optional()
      .default(1),
    limit: z
      .string()
      .transform(val => parseInt(val, 10))
      .refine(
        val => !isNaN(val) && val > 0 && val <= 100,
        '페이지 크기는 1-100 사이의 정수여야 합니다.'
      )
      .optional()
      .default(10),
  })
  .strict();

export type GetUsersDto = z.infer<typeof getUsersSchema>;

// 사용자 비활성화 스키마
export const deactivateUserSchema = z
  .object({
    userId: uuidSchema,
    reason: z
      .string()
      .min(1, '비활성화 사유는 필수입니다.')
      .max(500, '비활성화 사유는 500자 이하여야 합니다.')
      .trim()
      .optional(),
  })
  .strict();

export type DeactivateUserDto = z.infer<typeof deactivateUserSchema>;

// 사용자 활성화 스키마
export const activateUserSchema = z
  .object({
    userId: uuidSchema,
  })
  .strict();

export type ActivateUserDto = z.infer<typeof activateUserSchema>;
