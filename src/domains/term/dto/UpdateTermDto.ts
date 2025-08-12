/**
 * @deprecated 이 DTO는 Zod 스키마로 대체되었습니다.
 * src/schemas/term/update.schema.ts의 updateTermSchema를 사용하세요.
 */
import {
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateTermDto {
  @IsString({ message: '약관 제목은 문자열이어야 합니다.' })
  @MinLength(1, { message: '약관 제목은 필수입니다.' })
  @MaxLength(200, { message: '약관 제목은 200자 이하여야 합니다.' })
  @Transform(({ value }) => value?.trim())
  @IsOptional()
  title?: string;

  @IsString({ message: '약관 내용은 문자열이어야 합니다.' })
  @MinLength(1, { message: '약관 내용은 필수입니다.' })
  @MaxLength(10000, { message: '약관 내용은 10000자 이하여야 합니다.' })
  @Transform(({ value }) => value?.trim())
  @IsOptional()
  content?: string;

  @IsBoolean({ message: '필수 동의 여부는 boolean 값이어야 합니다.' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isRequired?: boolean;

  @IsString({ message: '약관 버전은 문자열이어야 합니다.' })
  @MinLength(1, { message: '약관 버전은 필수입니다.' })
  @MaxLength(50, { message: '약관 버전은 50자 이하여야 합니다.' })
  @Transform(({ value }) => value?.trim())
  @IsOptional()
  version?: string;
}
