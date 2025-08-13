import { z } from 'zod';
import { uuidParamSchema } from '../common/pagination.schema.js';

export const userIdParamSchema = uuidParamSchema;

// 사용자 이메일 쿼리 스키마
export const getUserByEmailSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력해주세요.')
    .toLowerCase()
    .trim(),
});

export type GetUserByEmailQuery = z.infer<typeof getUserByEmailSchema>;
