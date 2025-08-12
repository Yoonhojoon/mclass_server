/**
 * @deprecated 이 DTO는 Zod 스키마로 대체되었습니다.
 * src/schemas/auth/login.schema.ts의 loginSchema를 사용하세요.
 */
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail({}, { message: '유효한 이메일 형식이어야 합니다.' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password!: string;
}
