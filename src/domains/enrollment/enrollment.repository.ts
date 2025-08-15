import {
  PrismaClient,
  Enrollment,
  EnrollmentStatus,
  Prisma,
} from '@prisma/client';
import logger from '../../config/logger.config.js';

export interface CreateEnrollmentData {
  userId: string;
  mclassId: string;
  enrollmentFormId: string;
  answers: Prisma.InputJsonValue;
  idempotencyKey?: string;
}

export interface QueryOptions {
  skip?: number;
  take?: number;
  orderBy?: Prisma.EnrollmentOrderByWithRelationInput;
  where?: Prisma.EnrollmentWhereInput;
}

export class EnrollmentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateEnrollmentData): Promise<Enrollment> {
    logger.info('Enrollment 생성 시작', {
      userId: data.userId,
      mclassId: data.mclassId,
    });

    return this.prisma.enrollment.create({
      data,
      include: {
        mclass: true,
        enrollmentForm: true,
        user: true,
      },
    });
  }

  async findByUserId(
    userId: string,
    options: QueryOptions = {}
  ): Promise<Enrollment[]> {
    const { where: optWhere, ...rest } = options;

    return this.prisma.enrollment.findMany({
      where: { ...optWhere, userId }, // userId 강제 포함
      include: {
        mclass: true,
        enrollmentForm: true,
      },
      ...rest,
    });
  }

  async findByMclassId(
    mclassId: string,
    options?: QueryOptions
  ): Promise<Enrollment[]> {
    return this.prisma.enrollment.findMany({
      where: { mclassId },
      include: {
        user: true,
        enrollmentForm: true,
      },
      ...options,
    });
  }

  async findById(id: string): Promise<Enrollment | null> {
    return this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: true,
        mclass: true,
        enrollmentForm: true,
      },
    });
  }

  async updateStatus(
    id: string,
    status: EnrollmentStatus,
    decidedAt?: Date,
    decidedByAdminId?: string,
    reason?: string
  ): Promise<Enrollment> {
    return this.prisma.enrollment.update({
      where: { id },
      data: {
        status,
        decidedAt: decidedAt || new Date(),
        decidedByAdminId,
        reason,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        mclass: true,
        enrollmentForm: true,
      },
    });
  }

  async updateWithVersion(
    id: string,
    data: Record<string, unknown>,
    expectedVersion: number
  ): Promise<Enrollment> {
    return this.prisma.enrollment.update({
      where: {
        id,
        version: expectedVersion, // 낙관적 락
      },
      data: {
        ...data,
        version: { increment: 1 },
      },
      include: {
        user: true,
        mclass: true,
        enrollmentForm: true,
      },
    });
  }

  async countByMclassAndStatus(
    mclassId: string,
    status: EnrollmentStatus
  ): Promise<number> {
    return this.prisma.enrollment.count({
      where: { mclassId, status },
    });
  }

  async findByIdempotencyKey(
    idempotencyKey: string
  ): Promise<Enrollment | null> {
    return this.prisma.enrollment.findFirst({
      where: { idempotencyKey },
      include: {
        user: true,
        mclass: true,
        enrollmentForm: true,
      },
    });
  }

  async findByUserAndMclass(
    userId: string,
    mclassId: string
  ): Promise<Enrollment | null> {
    return this.prisma.enrollment.findUnique({
      where: {
        userId_mclassId: { userId, mclassId },
      },
      include: {
        user: true,
        mclass: true,
        enrollmentForm: true,
      },
    });
  }

  async findOldestWaitlist(mclassId: string): Promise<Enrollment | null> {
    // FOR UPDATE SKIP LOCKED로 FIFO 처리
    const result = await this.prisma.$queryRaw<Enrollment[]>`
      SELECT * FROM enrollments 
      WHERE mclass_id = ${mclassId} AND status = 'WAITLISTED' 
      ORDER BY applied_at ASC 
      FOR UPDATE SKIP LOCKED 
      LIMIT 1
    `;

    return result.length > 0 ? result[0] : null;
  }

  /**
   * 클래스 정보를 FOR UPDATE로 잠그고 조회
   */
  async findMclassWithLock(
    mclassId: string,
    client: PrismaClient | Prisma.TransactionClient = this.prisma
  ): Promise<{
    id: string;
    title: string;
    capacity: number | null;
    selectionType: string;
    recruitStartAt: Date;
    recruitEndAt: Date;
    visibility: string;
    allowWaitlist: boolean;
    waitlistCapacity: number | null;
    enrollmentForm: {
      id: string;
      isActive: boolean;
      questions: unknown;
    } | null;
  } | null> {
    const result = await client.$queryRaw<
      Array<{
        id: string;
        title: string;
        capacity: number | null;
        selection_type: string;
        recruit_start_at: Date;
        recruit_end_at: Date;
        visibility: string;
        allow_waitlist: boolean;
        waitlist_capacity: number | null;
        enrollment_form_id: string | null;
        enrollment_form_is_active: boolean | null;
        enrollment_form_questions: unknown;
      }>
    >`
      SELECT 
        m.id,
        m.title,
        m.capacity,
        m.selection_type,
        m.recruit_start_at,
        m.recruit_end_at,
        m.visibility,
        m.allow_waitlist,
        m.waitlist_capacity,
        ef.id as enrollment_form_id,
        ef.is_active as enrollment_form_is_active,
        ef.questions as enrollment_form_questions
      FROM mclasses m
      LEFT JOIN enrollment_forms ef ON m.enrollment_form_id = ef.id
      WHERE m.id = ${mclassId}
      FOR UPDATE
    `;

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      title: row.title,
      capacity: row.capacity,
      selectionType: row.selection_type,
      recruitStartAt: row.recruit_start_at,
      recruitEndAt: row.recruit_end_at,
      visibility: row.visibility,
      allowWaitlist: row.allow_waitlist,
      waitlistCapacity: row.waitlist_capacity,
      enrollmentForm: row.enrollment_form_id
        ? {
            id: row.enrollment_form_id,
            isActive: row.enrollment_form_is_active || false,
            questions: row.enrollment_form_questions,
          }
        : null,
    };
  }

  /**
   * 클래스 정보만 잠그고 조회 (상태 변경용)
   */
  async findMclassBasicWithLock(
    mclassId: string,
    client: PrismaClient | Prisma.TransactionClient = this.prisma
  ): Promise<{
    id: string;
    capacity: number | null;
    allowWaitlist: boolean;
  } | null> {
    const result = await client.$queryRaw<
      Array<{
        id: string;
        capacity: number | null;
        allow_waitlist: boolean;
      }>
    >`
      SELECT id, capacity, allow_waitlist
      FROM mclasses m
      WHERE m.id = ${mclassId}
      FOR UPDATE OF m
    `;
    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      capacity: row.capacity,
      allowWaitlist: row.allow_waitlist,
    };
  }

  async delete(id: string): Promise<Enrollment> {
    return this.prisma.enrollment.delete({
      where: { id },
      include: {
        user: true,
        mclass: true,
        enrollmentForm: true,
      },
    });
  }

  async getEnrollmentStats(mclassId: string): Promise<{
    totalEnrollments: number;
    applied: number;
    approved: number;
    rejected: number;
    waitlisted: number;
    canceled: number;
  }> {
    const stats = await this.prisma.enrollment.groupBy({
      by: ['status'],
      where: { mclassId },
      _count: {
        status: true,
      },
    });

    const result = {
      totalEnrollments: 0,
      applied: 0,
      approved: 0,
      rejected: 0,
      waitlisted: 0,
      canceled: 0,
    };

    stats.forEach(stat => {
      const count = stat._count.status;
      result.totalEnrollments += count;

      switch (stat.status) {
        case 'APPLIED':
          result.applied = count;
          break;
        case 'APPROVED':
          result.approved = count;
          break;
        case 'REJECTED':
          result.rejected = count;
          break;
        case 'WAITLISTED':
          result.waitlisted = count;
          break;
        case 'CANCELED':
          result.canceled = count;
          break;
      }
    });

    return result;
  }
}
