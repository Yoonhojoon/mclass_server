import { z } from 'zod';

export const CreateMClassDtoSchema = z
  .object({
    title: z
      .string()
      .min(1, '제목은 1자 이상이어야 합니다')
      .max(120, '제목은 120자 이하여야 합니다'),
    description: z.string().nullable().optional(),
    selectionType: z.enum(['FIRST_COME', 'REVIEW']).default('FIRST_COME'),
    capacity: z
      .number()
      .int()
      .positive('수용 인원은 1명 이상이어야 합니다')
      .nullable()
      .optional(),
    allowWaitlist: z.boolean().default(false),
    waitlistCapacity: z
      .number()
      .int()
      .positive('대기열 수용 인원은 1명 이상이어야 합니다')
      .nullable()
      .optional(),
    visibility: z.enum(['PUBLIC', 'UNLISTED']).default('PUBLIC'),
    recruitStartAt: z
      .string()
      .datetime(
        '모집 시작 시간은 ISO 8601 형식이어야 합니다 (예: 2025-01-15T10:00:00.000Z)'
      ),
    recruitEndAt: z
      .string()
      .datetime(
        '모집 종료 시간은 ISO 8601 형식이어야 합니다 (예: 2025-01-15T18:00:00.000Z)'
      ),
    startAt: z
      .string()
      .datetime(
        '시작 시간은 ISO 8601 형식이어야 합니다 (예: 2025-01-15T10:00:00.000Z)'
      ),
    endAt: z
      .string()
      .datetime(
        '종료 시간은 ISO 8601 형식이어야 합니다 (예: 2025-01-15T12:00:00.000Z)'
      ),
    isOnline: z.boolean().default(true),
    location: z.string().nullable().optional(),
    fee: z
      .number()
      .int()
      .min(0, '비용은 0 이상이어야 합니다')
      .nullable()
      .optional(),
  })
  .refine(
    data => {
      // recruitStartAt과 recruitEndAt 검증 (이제 필수 필드)
      return new Date(data.recruitStartAt) <= new Date(data.recruitEndAt);
    },
    {
      message: '모집 시작 시간은 모집 종료 시간보다 이전이어야 합니다',
      path: ['recruitStartAt'],
    }
  )
  .refine(
    data => {
      // startAt과 endAt 검증
      return new Date(data.startAt) <= new Date(data.endAt);
    },
    {
      message: '시작 시간은 종료 시간보다 이전이어야 합니다',
      path: ['startAt'],
    }
  )
  .refine(
    data => {
      // recruitEndAt과 startAt 검증 (이제 필수 필드)
      return new Date(data.recruitEndAt) <= new Date(data.startAt);
    },
    {
      message: '모집 종료 시간은 시작 시간보다 이전이어야 합니다',
      path: ['recruitEndAt'],
    }
  )
  .refine(
    data => {
      // waitlistCapacity는 allowWaitlist가 true일 때만 설정 가능
      if (data.waitlistCapacity && !data.allowWaitlist) {
        return false;
      }
      return true;
    },
    {
      message:
        '대기열을 허용하지 않는 경우 대기열 수용 인원을 설정할 수 없습니다',
      path: ['waitlistCapacity'],
    }
  );

export type CreateMClassDto = z.infer<typeof CreateMClassDtoSchema>;

/**
 * 시간 설정 예시:
 *
 * 1. 오전 10시부터 오후 12시까지 (2시간)
 *    startAt: "2025-01-15T10:00:00.000Z"
 *    endAt: "2025-01-15T12:00:00.000Z"
 *
 * 2. 오후 2시부터 오후 4시까지 (2시간)
 *    startAt: "2025-01-15T14:00:00.000Z"
 *    endAt: "2025-01-15T16:00:00.000Z"
 *
 * 3. 모집 기간 설정 (12월 1일부터 31일까지, 클래스는 2월 1일 오후 2시)
 *    recruitStartAt: "2024-12-01T00:00:00.000Z"
 *    recruitEndAt: "2024-12-31T23:59:59.000Z"
 *    startAt: "2025-02-01T14:00:00.000Z"
 *    endAt: "2025-02-01T16:00:00.000Z"
 *
 * 4. 한국 시간대 고려 (UTC+9)
 *    - 오전 10시 (한국 시간) = "2025-01-15T01:00:00.000Z" (UTC)
 *    - 오후 2시 (한국 시간) = "2025-01-15T05:00:00.000Z" (UTC)
 */
