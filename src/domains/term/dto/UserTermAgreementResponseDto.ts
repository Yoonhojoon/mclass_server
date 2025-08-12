import { Expose, Transform } from 'class-transformer';

export class UserTermAgreementResponseDto {
  @Expose()
  id!: string;

  @Expose()
  userId!: string;

  @Expose()
  termId!: string;

  @Expose()
  @Transform(({ value }) => value?.toISOString())
  agreedAt!: Date;

  @Expose()
  @Transform(({ value }) => value?.toISOString())
  createdAt!: Date;

  @Expose()
  @Transform(({ value }) => value?.toISOString())
  updatedAt!: Date;
}
