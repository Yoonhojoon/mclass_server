import { z } from 'zod';
import { registry, PaginatedResponseSchema } from '../../config/swagger-zod.js';

// 공통 스키마
const dateTimeSchema = z
  .string()
  .datetime('ISO 8601 형식이어야 합니다 (예: 2025-01-15T10:00:00.000Z)')
  .openapi({
    description: '날짜 시간 (ISO 8601 형식)',
    example: '2025-01-15T10:00:00.000Z',
  });

// MClass 단계 스키마
const mClassPhaseSchema = z
  .enum(['UPCOMING', 'RECRUITING', 'IN_PROGRESS', 'ENDED'])
  .openapi({ description: '클래스 단계' });

// MClass 응답 스키마
export const mClassResponseSchema = z.object({
  id: z.string().uuid().openapi({ description: '클래스 ID' }),
  title: z
    .string()
    .openapi({ description: '클래스 제목', example: 'JavaScript 기초 강의' }),
  description: z.string().nullable().openapi({ description: '클래스 설명' }),
  recruitStartAt: z
    .string()
    .datetime()
    .nullable()
    .openapi({ description: '모집 시작일시' }),
  recruitEndAt: z
    .string()
    .datetime()
    .nullable()
    .openapi({ description: '모집 종료일시' }),
  startAt: z.string().datetime().openapi({ description: '클래스 시작일시' }),
  endAt: z.string().datetime().openapi({ description: '클래스 종료일시' }),
  selectionType: z
    .enum(['FIRST_COME', 'REVIEW'])
    .openapi({ description: '선발 방식' }),
  capacity: z
    .number()
    .int()
    .nullable()
    .openapi({ description: '수용 인원 (null이면 무제한)' }),
  allowWaitlist: z.boolean().openapi({ description: '대기열 허용 여부' }),
  waitlistCapacity: z
    .number()
    .int()
    .nullable()
    .openapi({ description: '대기열 수용 인원' }),
  visibility: z
    .enum(['PUBLIC', 'UNLISTED'])
    .openapi({ description: '공개 여부' }),
  isOnline: z.boolean().openapi({ description: '온라인 클래스 여부' }),
  location: z.string().nullable().openapi({ description: '오프라인 장소' }),
  fee: z
    .number()
    .int()
    .nullable()
    .openapi({ description: '수강료 (0이면 무료)' }),
  phase: mClassPhaseSchema,
  createdBy: z.string().uuid().openapi({ description: '생성자 ID' }),
  createdAt: z.string().datetime().openapi({ description: '생성일시' }),
  updatedAt: z.string().datetime().openapi({ description: '수정일시' }),
});

// MClass 생성 스키마
export const createMClassSchema = z
  .object({
    title: z
      .string()
      .min(1, '제목은 1자 이상이어야 합니다')
      .max(120, '제목은 120자 이하여야 합니다')
      .trim()
      .openapi({
        description: '클래스 제목 (1-120자)',
        example: 'JavaScript 기초 강의',
      }),
    description: z
      .string()
      .trim()
      .nullable()
      .optional()
      .openapi({ description: '클래스 설명' }),
    selectionType: z
      .enum(['FIRST_COME', 'REVIEW'])
      .default('FIRST_COME')
      .openapi({ description: '선발 방식' }),
    capacity: z
      .number()
      .int()
      .positive('수용 인원은 1명 이상이어야 합니다')
      .nullable()
      .optional()
      .openapi({ description: '수용 인원 (null이면 무제한)' }),
    allowWaitlist: z
      .boolean()
      .default(false)
      .openapi({ description: '대기열 허용 여부' }),
    waitlistCapacity: z
      .number()
      .int()
      .positive('대기열 수용 인원은 1명 이상이어야 합니다')
      .nullable()
      .optional()
      .openapi({ description: '대기열 수용 인원' }),
    visibility: z
      .enum(['PUBLIC', 'UNLISTED'])
      .default('PUBLIC')
      .openapi({ description: '공개 여부' }),
    recruitStartAt: dateTimeSchema.nullable().optional(),
    recruitEndAt: dateTimeSchema.nullable().optional(),
    startAt: dateTimeSchema,
    endAt: dateTimeSchema,
    isOnline: z
      .boolean()
      .default(true)
      .openapi({ description: '온라인 클래스 여부' }),
    location: z
      .string()
      .trim()
      .nullable()
      .optional()
      .openapi({ description: '오프라인 장소' }),
    fee: z
      .number()
      .int()
      .min(0, '비용은 0 이상이어야 합니다')
      .nullable()
      .optional()
      .openapi({ description: '수강료 (0이면 무료)' }),
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
  .openapi({ description: 'MClass 생성 요청' });

// MClass 수정 스키마
export const updateMClassSchema = z
  .object({
    title: z
      .string()
      .min(1, '제목은 1자 이상이어야 합니다')
      .max(120, '제목은 120자 이하여야 합니다')
      .trim()
      .optional()
      .openapi({ description: '클래스 제목 (1-120자)' }),
    description: z
      .string()
      .trim()
      .nullable()
      .optional()
      .openapi({ description: '클래스 설명' }),
    selectionType: z
      .enum(['FIRST_COME', 'REVIEW'])
      .optional()
      .openapi({ description: '선발 방식' }),
    capacity: z
      .number()
      .int()
      .positive('수용 인원은 1명 이상이어야 합니다')
      .nullable()
      .optional()
      .openapi({ description: '수용 인원 (null이면 무제한)' }),
    allowWaitlist: z
      .boolean()
      .optional()
      .openapi({ description: '대기열 허용 여부' }),
    waitlistCapacity: z
      .number()
      .int()
      .positive('대기열 수용 인원은 1명 이상이어야 합니다')
      .nullable()
      .optional()
      .openapi({ description: '대기열 수용 인원' }),
    visibility: z
      .enum(['PUBLIC', 'UNLISTED'])
      .optional()
      .openapi({ description: '공개 여부' }),
    recruitStartAt: dateTimeSchema.nullable().optional(),
    recruitEndAt: dateTimeSchema.nullable().optional(),
    startAt: dateTimeSchema.optional(),
    endAt: dateTimeSchema.optional(),
    isOnline: z
      .boolean()
      .optional()
      .openapi({ description: '온라인 클래스 여부' }),
    location: z
      .string()
      .trim()
      .nullable()
      .optional()
      .openapi({ description: '오프라인 장소' }),
    fee: z
      .number()
      .int()
      .min(0, '비용은 0 이상이어야 합니다')
      .nullable()
      .optional()
      .openapi({ description: '수강료 (0이면 무료)' }),
  })
  .openapi({ description: 'MClass 수정 요청' });

// MClass 목록 조회 스키마
export const mClassListQuerySchema = z
  .object({
    phase: z
      .enum(['UPCOMING', 'RECRUITING', 'IN_PROGRESS', 'ENDED'])
      .optional()
      .openapi({ description: '클래스 단계 필터' }),
    selectionType: z
      .enum(['FIRST_COME', 'REVIEW'])
      .optional()
      .openapi({ description: '선발 방식 필터' }),
    visibility: z
      .enum(['PUBLIC', 'UNLISTED'])
      .default('PUBLIC')
      .openapi({ description: '공개 여부 필터 (관리자만 UNLISTED 조회 가능)' }),
    page: z
      .number()
      .int()
      .min(1)
      .default(1)
      .openapi({ description: '페이지 번호', example: 1 }),
    size: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .openapi({ description: '페이지 크기 (최대 100)', example: 20 }),
    sort: z
      .enum(['startAt', 'recruitStartAt', 'createdAt'])
      .default('startAt')
      .openapi({ description: '정렬 기준' }),
    order: z
      .enum(['asc', 'desc'])
      .default('asc')
      .openapi({ description: '정렬 순서' }),
  })
  .openapi({ description: 'MClass 목록 조회 쿼리' });

// MClass 통계 응답 스키마
export const mClassStatisticsResponseSchema = z.object({
  approvedCount: z.number().int().openapi({ description: '승인된 인원 수' }),
  waitlistedCount: z.number().int().openapi({ description: '대기열 인원 수' }),
});

// MClass 목록 응답 스키마
export const mClassListResponseSchema =
  PaginatedResponseSchema(mClassResponseSchema);

// 스키마들을 레지스트리에 등록
registry.register('MClass', mClassResponseSchema);
registry.register('CreateMClassRequest', createMClassSchema);
registry.register('UpdateMClassRequest', updateMClassSchema);
registry.register('MClassListQuery', mClassListQuerySchema);
registry.register('MClassListResponse', mClassListResponseSchema);
registry.register('MClassStatistics', mClassStatisticsResponseSchema);

// 타입 내보내기
export type CreateMClassRequest = z.infer<typeof createMClassSchema>;
export type UpdateMClassRequest = z.infer<typeof updateMClassSchema>;
export type MClassListQuery = z.infer<typeof mClassListQuerySchema>;
export type MClassResponse = z.infer<typeof mClassResponseSchema>;
export type MClassListResponse = z.infer<typeof mClassListResponseSchema>;
export type MClassStatisticsResponse = z.infer<
  typeof mClassStatisticsResponseSchema
>;
