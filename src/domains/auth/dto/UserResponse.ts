/**
 * @deprecated 이 DTO는 Zod 스키마로 대체되었습니다.
 * src/schemas/auth/response.schema.ts의 userResponseSchema를 사용하세요.
 */
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  name!: string | null;

  @Expose()
  role!: string;

  @Expose()
  isAdmin!: boolean;

  @Expose()
  isSignUpCompleted!: boolean;

  @Expose()
  provider!: string;
}
