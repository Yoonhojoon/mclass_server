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

// 회원가입 스키마
export const registerSchema = z
  .object({
    email: emailSchema,
    name: z
      .string()
      .trim()
      .min(1, '이름은 필수입니다.')
      .max(50, '이름은 50자 이하여야 합니다.'),
    password: passwordSchema,
  })
  .strict();

export type RegisterRequest = z.infer<typeof registerSchema>;
