/**
 * @deprecated 이 DTO는 Zod 스키마로 대체되었습니다.
 * src/schemas/mclass/response.schema.ts의 mClassResponseSchema를 사용하세요.
 */
import { Expose, Transform } from 'class-transformer';

export class MClassResponseDto {
  @Expose()
  id!: string;

  @Expose()
  title!: string;

  @Expose()
  description!: string | null;

  @Expose()
  recruitStartAt!: string | null;

  @Expose()
  @Transform(({ value }) => value?.toISOString())
  recruitEndAt!: string | null;

  @Expose()
  startAt!: string;

  @Expose()
  @Transform(({ value }) => value?.toISOString())
  endAt!: string;

  @Expose()
  selectionType!: string;

  @Expose()
  capacity!: number | null;

  @Expose()
  approvedCount!: number;

  @Expose()
  allowWaitlist!: boolean;

  @Expose()
  waitlistCapacity!: number | null;

  @Expose()
  visibility!: string;

  @Expose()
  isOnline!: boolean;

  @Expose()
  location!: string | null;

  @Expose()
  fee!: number | null;

  @Expose()
  phase!: string;

  @Expose()
  createdBy!: string;

  @Expose()
  @Transform(({ value }) => value?.toISOString())
  createdAt!: string;

  @Expose()
  @Transform(({ value }) => value?.toISOString())
  updatedAt!: string;
}
