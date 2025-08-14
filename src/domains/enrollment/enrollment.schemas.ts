import { z } from 'zod';
import { EnrollmentStatus, ReasonType } from '@prisma/client';

// 기본 답변 스키마
export const AnswerSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.boolean(),
]);

// 답변 객체 스키마
export const AnswersSchema = z.record(z.string(), AnswerSchema);

// 신청 생성 요청 스키마
export const CreateEnrollmentSchema = z.object({
  answers: AnswersSchema,
  idempotencyKey: z.string().optional(),
});

// 신청 수정 요청 스키마
export const UpdateEnrollmentSchema = z.object({
  answers: AnswersSchema,
});

// 신청 취소 요청 스키마
export const CancelEnrollmentSchema = z.object({
  reason: z.string().optional(),
});

// 관리자 상태 변경 요청 스키마
export const UpdateEnrollmentStatusSchema = z.object({
  status: z.nativeEnum(EnrollmentStatus),
  reason: z.string().optional(),
});

// 쿼리 파라미터 스키마
export const EnrollmentQuerySchema = z.object({
  status: z.nativeEnum(EnrollmentStatus).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

// 관리자 쿼리 파라미터 스키마
export const AdminEnrollmentQuerySchema = z.object({
  status: z.nativeEnum(EnrollmentStatus).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

// 응답 스키마들
export const EnrollmentResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  mclassId: z.string(),
  enrollmentFormId: z.string(),
  answers: z.record(z.string(), z.any()),
  status: z.nativeEnum(EnrollmentStatus),
  appliedAt: z.date(),
  decidedAt: z.date().nullable(),
  canceledAt: z.date().nullable(),
  reason: z.string().nullable(),
  formVersion: z.number(),
  formSnapshot: z.record(z.string(), z.any()).nullable(),
  decidedByAdminId: z.string().nullable(),
  reasonType: z.nativeEnum(ReasonType).nullable(),
  version: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  mclass: z
    .object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      capacity: z.number().nullable(),
      startAt: z.date(),
      endAt: z.date(),
    })
    .optional(),
  user: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string(),
    })
    .optional(),
  enrollmentForm: z
    .object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      questions: z.record(z.string(), z.any()),
    })
    .optional(),
});

export const EnrollmentStatsSchema = z.object({
  totalEnrollments: z.number(),
  applied: z.number(),
  approved: z.number(),
  rejected: z.number(),
  waitlisted: z.number(),
  canceled: z.number(),
  capacity: z.number().nullable(),
  waitlistCapacity: z.number().nullable(),
});

export const AvailabilitySchema = z.object({
  canEnroll: z.boolean(),
  currentEnrollments: z.number(),
  capacity: z.number().nullable(),
  waitlistCount: z.number(),
  waitlistCapacity: z.number().nullable(),
  recruitEndAt: z.date(),
  isRecruitmentActive: z.boolean(),
  selectionType: z.enum(['FIRST_COME', 'REVIEW']),
});

// 타입 정의
export type CreateEnrollmentRequest = z.infer<typeof CreateEnrollmentSchema>;
export type UpdateEnrollmentRequest = z.infer<typeof UpdateEnrollmentSchema>;
export type CancelEnrollmentRequest = z.infer<typeof CancelEnrollmentSchema>;
export type UpdateEnrollmentStatusRequest = z.infer<
  typeof UpdateEnrollmentStatusSchema
>;
export type EnrollmentQuery = z.infer<typeof EnrollmentQuerySchema>;
export type AdminEnrollmentQuery = z.infer<typeof AdminEnrollmentQuerySchema>;
export type EnrollmentResponse = z.infer<typeof EnrollmentResponseSchema>;
export type EnrollmentStats = z.infer<typeof EnrollmentStatsSchema>;
export type Availability = z.infer<typeof AvailabilitySchema>;
