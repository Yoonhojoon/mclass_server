/**
 * @deprecated 이 DTO는 Zod 스키마로 대체되었습니다.
 * src/schemas/auth/register.schema.ts의 registerSchema를 사용하세요.
 */
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';

export { UserRole };

export class RegisterDto {
  @IsEmail({}, { message: '유효한 이메일 형식이어야 합니다.' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password!: string;

  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @Transform(({ value }) => value?.trim())
  @MinLength(1, { message: '이름은 필수입니다.' })
  name!: string;

  @IsEnum(UserRole, { message: '유효한 역할이어야 합니다.' })
  @IsOptional()
  role?: UserRole;
}
