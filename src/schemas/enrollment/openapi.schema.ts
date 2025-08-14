import { z } from 'zod';
import { registry } from '../../config/swagger-zod.js';

// 기본 답변 스키마
export const AnswerSchema = z
  .union([z.string(), z.array(z.string()), z.boolean()])
  .openapi({ description: '답변 값 (문자열, 문자열 배열, 또는 불린)' });

// 답변 객체 스키마
export const AnswersSchema = z
  .record(z.string(), AnswerSchema)
  .openapi({ description: '질문 ID를 키로 하는 답변 객체' });

// 신청 생성 요청 스키마
export const CreateEnrollmentSchema = z
  .object({
    answers: AnswersSchema,
    idempotencyKey: z.string().optional().openapi({
      description: '멱등성 키 (중복 요청 방지)',
      example: 'user-123-mclass-456-1234567890',
    }),
  })
  .openapi({ description: '클래스 신청 요청' });

// 신청 수정 요청 스키마
export const UpdateEnrollmentSchema = z
  .object({
    answers: AnswersSchema,
  })
  .openapi({ description: '신청 수정 요청' });

// 신청 취소 요청 스키마
export const CancelEnrollmentSchema = z
  .object({
    reason: z.string().optional().openapi({
      description: '취소 사유',
      example: '일정 변경으로 인한 취소',
    }),
  })
  .openapi({ description: '신청 취소 요청' });

// 관리자 상태 변경 요청 스키마
export const UpdateEnrollmentStatusSchema = z
  .object({
    status: z
      .enum(['APPROVED', 'REJECTED', 'WAITLISTED'])
      .openapi({ description: '변경할 신청 상태' }),
    reason: z.string().optional().openapi({
      description: '거절 사유 (REJECTED인 경우)',
      example: '정원 초과로 인한 거절',
    }),
  })
  .openapi({ description: '관리자 신청 상태 변경 요청' });

// 쿼리 파라미터 스키마
export const EnrollmentQuerySchema = z
  .object({
    status: z
      .enum(['APPLIED', 'APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELED'])
      .optional()
      .openapi({ description: '신청 상태 필터' }),
    page: z.coerce
      .number()
      .min(1)
      .default(1)
      .openapi({ description: '페이지 번호', example: 1 }),
    limit: z.coerce
      .number()
      .min(1)
      .max(100)
      .default(10)
      .openapi({ description: '페이지당 항목 수', example: 10 }),
    search: z
      .string()
      .optional()
      .openapi({ description: '검색어 (관리자용)', example: '홍길동' }),
  })
  .openapi({ description: '신청 목록 조회 쿼리 파라미터' });

// 관리자 쿼리 파라미터 스키마
export const AdminEnrollmentQuerySchema = z
  .object({
    status: z
      .enum(['APPLIED', 'APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELED'])
      .optional()
      .openapi({ description: '신청 상태 필터' }),
    page: z.coerce
      .number()
      .min(1)
      .default(1)
      .openapi({ description: '페이지 번호', example: 1 }),
    limit: z.coerce
      .number()
      .min(1)
      .max(100)
      .default(10)
      .openapi({ description: '페이지당 항목 수', example: 10 }),
    search: z
      .string()
      .optional()
      .openapi({ description: '사용자 이름/이메일 검색', example: '홍길동' }),
  })
  .openapi({ description: '관리자 신청 목록 조회 쿼리 파라미터' });

// 응답 스키마들
export const EnrollmentResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ description: '신청 ID' }),
    userId: z.string().uuid().openapi({ description: '사용자 ID' }),
    mclassId: z.string().uuid().openapi({ description: '클래스 ID' }),
    enrollmentFormId: z
      .string()
      .uuid()
      .openapi({ description: '신청서 양식 ID' }),
    answers: z
      .record(z.string(), z.any())
      .openapi({ description: '신청서 답변' }),
    status: z
      .enum(['APPLIED', 'APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELED'])
      .openapi({ description: '신청 상태' }),
    appliedAt: z.date().openapi({ description: '신청 시간' }),
    decidedAt: z.date().nullable().openapi({ description: '결정 시간' }),
    canceledAt: z.date().nullable().openapi({ description: '취소 시간' }),
    reason: z.string().nullable().openapi({ description: '사유' }),
    formVersion: z.number().openapi({ description: '신청서 버전' }),
    formSnapshot: z
      .record(z.string(), z.any())
      .nullable()
      .openapi({ description: '신청서 스냅샷' }),
    decidedByAdminId: z
      .string()
      .uuid()
      .nullable()
      .openapi({ description: '결정한 관리자 ID' }),
    reasonType: z
      .enum(['REJECT', 'CANCEL'])
      .nullable()
      .openapi({ description: '사유 타입' }),
    version: z.number().openapi({ description: '버전 (낙관적 락용)' }),
    createdAt: z.date().openapi({ description: '생성 시간' }),
    updatedAt: z.date().openapi({ description: '수정 시간' }),
    mclass: z
      .object({
        id: z.string().uuid().openapi({ description: '클래스 ID' }),
        title: z.string().openapi({ description: '클래스 제목' }),
        description: z
          .string()
          .nullable()
          .openapi({ description: '클래스 설명' }),
        capacity: z.number().nullable().openapi({ description: '정원' }),
        startAt: z.date().openapi({ description: '시작 시간' }),
        endAt: z.date().openapi({ description: '종료 시간' }),
      })
      .optional()
      .openapi({ description: '클래스 정보' }),
    user: z
      .object({
        id: z.string().uuid().openapi({ description: '사용자 ID' }),
        name: z.string().nullable().openapi({ description: '사용자 이름' }),
        email: z.string().email().openapi({ description: '사용자 이메일' }),
      })
      .optional()
      .openapi({ description: '사용자 정보' }),
    enrollmentForm: z
      .object({
        id: z.string().uuid().openapi({ description: '신청서 양식 ID' }),
        title: z.string().openapi({ description: '신청서 제목' }),
        description: z
          .string()
          .nullable()
          .openapi({ description: '신청서 설명' }),
        questions: z
          .record(z.string(), z.any())
          .openapi({ description: '질문 구조' }),
      })
      .optional()
      .openapi({ description: '신청서 양식 정보' }),
  })
  .openapi({ description: '신청 응답' });

export const EnrollmentStatsSchema = z
  .object({
    totalEnrollments: z.number().openapi({ description: '전체 신청 수' }),
    applied: z.number().openapi({ description: '신청 대기 수' }),
    approved: z.number().openapi({ description: '승인 수' }),
    rejected: z.number().openapi({ description: '거절 수' }),
    waitlisted: z.number().openapi({ description: '대기자 수' }),
    canceled: z.number().openapi({ description: '취소 수' }),
    capacity: z.number().nullable().openapi({ description: '정원' }),
    waitlistCapacity: z
      .number()
      .nullable()
      .openapi({ description: '대기자 정원' }),
  })
  .openapi({ description: '신청 통계' });

export const AvailabilitySchema = z
  .object({
    canEnroll: z.boolean().openapi({ description: '신청 가능 여부' }),
    currentEnrollments: z.number().openapi({ description: '현재 신청 수' }),
    capacity: z.number().nullable().openapi({ description: '정원' }),
    waitlistCount: z.number().openapi({ description: '대기자 수' }),
    waitlistCapacity: z
      .number()
      .nullable()
      .openapi({ description: '대기자 정원' }),
    recruitEndAt: z.date().openapi({ description: '신청 마감 시간' }),
    isRecruitmentActive: z
      .boolean()
      .openapi({ description: '신청 기간 활성화 여부' }),
    selectionType: z
      .enum(['FIRST_COME', 'REVIEW'])
      .openapi({ description: '선발 방식' }),
  })
  .openapi({ description: '신청 가능 여부 정보' });

// 파라미터 스키마들
export const mclassIdParamSchema = z.object({
  mclassId: z.string().uuid().openapi({ description: '클래스 ID' }),
});

export const enrollmentIdParamSchema = z.object({
  enrollmentId: z.string().uuid().openapi({ description: '신청 ID' }),
});

// 스키마들을 레지스트리에 등록
registry.register('CreateEnrollment', CreateEnrollmentSchema);
registry.register('UpdateEnrollment', UpdateEnrollmentSchema);
registry.register('CancelEnrollment', CancelEnrollmentSchema);
registry.register('UpdateEnrollmentStatus', UpdateEnrollmentStatusSchema);
registry.register('EnrollmentQuery', EnrollmentQuerySchema);
registry.register('AdminEnrollmentQuery', AdminEnrollmentQuerySchema);
registry.register('EnrollmentResponse', EnrollmentResponseSchema);
registry.register('EnrollmentStats', EnrollmentStatsSchema);
registry.register('Availability', AvailabilitySchema);
registry.register('MclassIdParam', mclassIdParamSchema);
registry.register('EnrollmentIdParam', enrollmentIdParamSchema);
