/**
 * @deprecated 이 DTO는 Zod 스키마로 대체되었습니다.
 * src/schemas/mclass/create.schema.ts의 createMClassSchema를 사용하세요.
 */
import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum SelectionType {
  FIRST_COME = 'FIRST_COME',
  REVIEW = 'REVIEW',
}

export enum Visibility {
  PUBLIC = 'PUBLIC',
  UNLISTED = 'UNLISTED',
}

export class CreateMClassDto {
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @MinLength(1, { message: '제목은 1자 이상이어야 합니다.' })
  @MaxLength(120, { message: '제목은 120자 이하여야 합니다.' })
  @Transform(({ value }) => value?.trim())
  title!: string;

  @IsString({ message: '설명은 문자열이어야 합니다.' })
  @MaxLength(1000, { message: '설명은 1000자 이하여야 합니다.' })
  @Transform(({ value }) => value?.trim() || null)
  @IsOptional()
  description?: string | null;

  @IsEnum(SelectionType, { message: '유효한 선택 유형이어야 합니다.' })
  @IsOptional()
  selectionType?: SelectionType = SelectionType.FIRST_COME;

  @IsNumber({}, { message: '수용 인원은 숫자여야 합니다.' })
  @Min(1, { message: '수용 인원은 1명 이상이어야 합니다.' })
  @Transform(({ value }) => (value ? parseInt(value) : null))
  @IsOptional()
  capacity?: number | null;

  @IsBoolean({ message: '대기열 허용 여부는 boolean 값이어야 합니다.' })
  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  allowWaitlist?: boolean = false;

  @IsNumber({}, { message: '대기열 수용 인원은 숫자여야 합니다.' })
  @Min(1, { message: '대기열 수용 인원은 1명 이상이어야 합니다.' })
  @Transform(({ value }) => (value ? parseInt(value) : null))
  @IsOptional()
  waitlistCapacity?: number | null;

  @IsEnum(Visibility, { message: '유효한 공개 설정이어야 합니다.' })
  @IsOptional()
  visibility?: Visibility = Visibility.PUBLIC;

  @IsDateString(
    {},
    { message: '모집 시작 시간은 유효한 날짜 형식이어야 합니다.' }
  )
  @IsOptional()
  recruitStartAt?: string;

  @IsDateString(
    {},
    { message: '모집 종료 시간은 유효한 날짜 형식이어야 합니다.' }
  )
  @IsOptional()
  recruitEndAt?: string;

  @IsDateString({}, { message: '시작 시간은 유효한 날짜 형식이어야 합니다.' })
  startAt!: string;

  @IsDateString({}, { message: '종료 시간은 유효한 날짜 형식이어야 합니다.' })
  endAt!: string;

  @IsBoolean({ message: '온라인 여부는 boolean 값이어야 합니다.' })
  @IsOptional()
  isOnline?: boolean = true;

  @IsString({ message: '위치는 문자열이어야 합니다.' })
  @Transform(({ value }) => value?.trim() || null)
  @IsOptional()
  location?: string | null;

  @IsNumber({}, { message: '비용은 숫자여야 합니다.' })
  @Min(0, { message: '비용은 0 이상이어야 합니다.' })
  @Transform(({ value }) => (value ? parseInt(value) : null))
  @IsOptional()
  fee?: number | null;
}
