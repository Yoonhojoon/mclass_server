import { z } from 'zod';

export const UpdateMClassDtoSchema = z
  .object({
    title: z
      .string()
      .min(1, '제목은 1자 이상이어야 합니다')
      .max(120, '제목은 120자 이하여야 합니다')
      .optional(),
    description: z.string().nullable().optional(),
    selectionType: z.enum(['FIRST_COME', 'REVIEW']).optional(),
    capacity: z
      .number()
      .int()
      .positive('수용 인원은 1명 이상이어야 합니다')
      .nullable()
      .optional(),
    allowWaitlist: z.boolean().optional(),
    waitlistCapacity: z
      .number()
      .int()
      .positive('대기열 수용 인원은 1명 이상이어야 합니다')
      .nullable()
      .optional(),
    visibility: z.enum(['PUBLIC', 'UNLISTED']).optional(),
    recruitStartAt: z
      .string()
      .datetime(
        '모집 시작 시간은 ISO 8601 형식이어야 합니다 (예: 2025-01-15T10:00:00.000Z)'
      )
      .optional(),
    recruitEndAt: z
      .string()
      .datetime(
        '모집 종료 시간은 ISO 8601 형식이어야 합니다 (예: 2025-01-15T18:00:00.000Z)'
      )
      .optional(),
    startAt: z
      .string()
      .datetime(
        '시작 시간은 ISO 8601 형식이어야 합니다 (예: 2025-01-15T10:00:00.000Z)'
      )
      .optional(),
    endAt: z
      .string()
      .datetime(
        '종료 시간은 ISO 8601 형식이어야 합니다 (예: 2025-01-15T12:00:00.000Z)'
      )
      .optional(),
    isOnline: z.boolean().optional(),
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
      // recruitStartAt과 recruitEndAt이 모두 제공된 경우
      if (data.recruitStartAt && data.recruitEndAt) {
        return new Date(data.recruitStartAt) <= new Date(data.recruitEndAt);
      }
      return true;
    },
    {
      message: '모집 시작 시간은 모집 종료 시간보다 이전이어야 합니다',
      path: ['recruitStartAt'],
    }
  )
  .refine(
    data => {
      // startAt과 endAt이 모두 제공된 경우
      if (data.startAt && data.endAt) {
        return new Date(data.startAt) <= new Date(data.endAt);
      }
      return true;
    },
    {
      message: '시작 시간은 종료 시간보다 이전이어야 합니다',
      path: ['startAt'],
    }
  )
  .refine(
    data => {
      // recruitEndAt과 startAt이 모두 제공된 경우
      if (data.recruitEndAt && data.startAt) {
        return new Date(data.recruitEndAt) <= new Date(data.startAt);
      }
      return true;
    },
    {
      message: '모집 종료 시간은 시작 시간보다 이전이어야 합니다',
      path: ['recruitEndAt'],
    }
  )
  .refine(
    data => {
      // waitlistCapacity는 allowWaitlist가 true일 때만 설정 가능
      if (data.waitlistCapacity && data.allowWaitlist === false) {
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

export type UpdateMClassDto = z.infer<typeof UpdateMClassDtoSchema>;

/**
 * 시간 설정 예시 (부분 업데이트):
 *
 * 1. 시작 시간만 변경
 *    startAt: "2025-01-15T14:00:00.000Z"
 *
 * 2. 모집 기간 추가
 *    recruitStartAt: "2024-12-01T00:00:00.000Z"
 *    recruitEndAt: "2024-12-31T23:59:59.000Z"
 *
 * 3. 클래스 시간 변경
 *    startAt: "2025-01-15T15:00:00.000Z"
 *    endAt: "2025-01-15T17:00:00.000Z"
 */
