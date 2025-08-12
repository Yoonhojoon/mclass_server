import { z } from 'zod';

// 공통 스키마
const dateTimeSchema = z
  .string()
  .datetime('ISO 8601 형식이어야 합니다 (예: 2025-01-15T10:00:00.000Z)');

// MClass 수정 스키마
export const updateMClassSchema = z
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
    recruitStartAt: dateTimeSchema.optional(),
    recruitEndAt: dateTimeSchema.optional(),
    startAt: dateTimeSchema.optional(),
    endAt: dateTimeSchema.optional(),
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
  )
  .refine(data => Object.keys(data).length > 0, {
    message: '최소 하나의 필드를 수정해야 합니다.',
  });

export type UpdateMClassRequest = z.infer<typeof updateMClassSchema>;
