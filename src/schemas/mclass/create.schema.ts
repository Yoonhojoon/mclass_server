import { z } from 'zod';

// 공통 스키마
const dateTimeSchema = z
  .string()
  .datetime('ISO 8601 형식이어야 합니다 (예: 2025-01-15T10:00:00.000Z)');

// MClass 생성 스키마
export const createMClassSchema = z
  .object({
    title: z
      .string()
      .min(1, '제목은 1자 이상이어야 합니다')
      .max(120, '제목은 120자 이하여야 합니다')
      .trim(),
    description: z.string().trim().nullable().optional(),
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
    recruitStartAt: dateTimeSchema,
    recruitEndAt: dateTimeSchema,
    startAt: dateTimeSchema,
    endAt: dateTimeSchema,
    isOnline: z.boolean().default(true),
    location: z.string().trim().nullable().optional(),
    fee: z
      .number()
      .int()
      .min(0, '비용은 0 이상이어야 합니다')
      .nullable()
      .optional(),
  })
  .refine(
    data => {
      if (data.recruitStartAt && data.recruitEndAt) {
        return new Date(data.recruitStartAt) < new Date(data.recruitEndAt);
      }
      return true;
    },
    {
      message: '모집 시작 시간은 모집 종료 시간보다 이전이어야 합니다.',
      path: ['recruitEndAt'],
    }
  )
  .refine(
    data => {
      if (data.startAt && data.endAt) {
        return new Date(data.startAt) < new Date(data.endAt);
      }
      return true;
    },
    {
      message: '시작 시간은 종료 시간보다 이전이어야 합니다.',
      path: ['endAt'],
    }
  )
  .refine(
    data => {
      if (data.allowWaitlist && !data.waitlistCapacity) {
        return false;
      }
      return true;
    },
    {
      message: '대기열을 허용할 경우 대기열 수용 인원을 설정해야 합니다.',
      path: ['waitlistCapacity'],
    }
  );

export type CreateMClassRequest = z.infer<typeof createMClassSchema>;
