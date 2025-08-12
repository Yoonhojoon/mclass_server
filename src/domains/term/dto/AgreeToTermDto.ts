/**
 * @deprecated 이 DTO는 Zod 스키마로 대체되었습니다.
 * src/schemas/term/agreement.schema.ts의 agreeToTermSchema를 사용하세요.
 */
import { IsUUID } from 'class-validator';

export class AgreeToTermDto {
  @IsUUID('4', { message: '유효한 UUID 형식이어야 합니다.' })
  termId!: string;
}
