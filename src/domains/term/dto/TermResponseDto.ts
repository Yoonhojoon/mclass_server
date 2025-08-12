import { Expose, Transform } from 'class-transformer';

export class TermResponseDto {
  @Expose()
  id!: string;

  @Expose()
  type!: string;

  @Expose()
  title!: string;

  @Expose()
  content!: string;

  @Expose()
  isRequired!: boolean;

  @Expose()
  version!: string;

  @Expose()
  @Transform(({ value }) => value?.toISOString())
  createdAt!: Date;

  @Expose()
  @Transform(({ value }) => value?.toISOString())
  updatedAt!: Date;
}
