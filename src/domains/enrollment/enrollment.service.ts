import { PrismaClient, Enrollment, EnrollmentForm } from '@prisma/client';
import { BaseError } from '../../common/exception/BaseError';
import { EnrollmentError } from '../../common/exception/enrollment/EnrollmentError';

export class EnrollmentService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 사용자의 수강 신청 목록 조회
   */
  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    try {
      return await this.prisma.enrollment.findMany({
        where: { user_id: userId },
        include: {
          mclass: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          form: true,
        },
        orderBy: {
          applied_at: 'desc',
        },
      });
    } catch (error) {
      throw new EnrollmentError('수강 신청 목록 조회에 실패했습니다.', error);
    }
  }

  /**
   * 특정 수강 신청 조회
   */
  async getEnrollmentById(id: string): Promise<Enrollment | null> {
    try {
      return await this.prisma.enrollment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          mclass: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          form: true,
        },
      });
    } catch (error) {
      throw new EnrollmentError('수강 신청 조회에 실패했습니다.', error);
    }
  }

  /**
   * 클래스의 수강 신청 목록 조회
   */
  async getClassEnrollments(classId: string): Promise<Enrollment[]> {
    try {
      return await this.prisma.enrollment.findMany({
        where: { mclass_id: classId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          form: true,
        },
        orderBy: {
          applied_at: 'asc',
        },
      });
    } catch (error) {
      throw new EnrollmentError(
        '클래스 수강 신청 목록 조회에 실패했습니다.',
        error
      );
    }
  }

  /**
   * 수강 신청 생성
   */
  async createEnrollment(
    userId: string,
    classId: string,
    formData?: {
      phone?: string;
      birth_date?: Date;
      gender?: 'M' | 'F';
      is_student?: boolean;
      school_name?: string;
      major?: string;
      address?: string;
      available_time?: string[];
      support_reason?: string;
      wanted_activity?: string;
      experience?: string;
      introduce?: string;
      agree_terms?: boolean;
    }
  ): Promise<Enrollment> {
    try {
      // 이미 신청했는지 확인
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: {
          user_id_mclass_id: {
            user_id: userId,
            mclass_id: classId,
          },
        },
      });

      if (existingEnrollment) {
        throw new EnrollmentError('이미 신청한 클래스입니다.');
      }

      // 클래스가 존재하는지 확인
      const classInfo = await this.prisma.mClass.findUnique({
        where: { id: classId },
        include: {
          enrollments: true,
        },
      });

      if (!classInfo) {
        throw new EnrollmentError('존재하지 않는 클래스입니다.');
      }

      // 수용 인원 확인
      if (classInfo.enrollments.length >= classInfo.capacity) {
        throw new EnrollmentError('수강 인원이 마감되었습니다.');
      }

      // 약관 동의 확인
      if (formData && !formData.agree_terms) {
        throw new EnrollmentError('약관에 동의해야 합니다.');
      }

      return await this.prisma.enrollment.create({
        data: {
          user_id: userId,
          mclass_id: classId,
          form: formData
            ? {
                create: formData,
              }
            : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          mclass: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          form: true,
        },
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw new EnrollmentError('수강 신청에 실패했습니다.', error);
    }
  }

  /**
   * 수강 신청 취소
   */
  async cancelEnrollment(enrollmentId: string, userId: string): Promise<void> {
    try {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: enrollmentId },
      });

      if (!enrollment) {
        throw new EnrollmentError('존재하지 않는 수강 신청입니다.');
      }

      if (enrollment.user_id !== userId) {
        throw new EnrollmentError('본인의 수강 신청만 취소할 수 있습니다.');
      }

      await this.prisma.enrollment.delete({
        where: { id: enrollmentId },
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw new EnrollmentError('수강 신청 취소에 실패했습니다.', error);
    }
  }

  /**
   * 수강 신청서 수정
   */
  async updateEnrollmentForm(
    enrollmentId: string,
    userId: string,
    formData: {
      phone?: string;
      birth_date?: Date;
      gender?: 'M' | 'F';
      is_student?: boolean;
      school_name?: string;
      major?: string;
      address?: string;
      available_time?: string[];
      support_reason?: string;
      wanted_activity?: string;
      experience?: string;
      introduce?: string;
      agree_terms?: boolean;
    }
  ): Promise<EnrollmentForm> {
    try {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { form: true },
      });

      if (!enrollment) {
        throw new EnrollmentError('존재하지 않는 수강 신청입니다.');
      }

      if (enrollment.user_id !== userId) {
        throw new EnrollmentError('본인의 수강 신청서만 수정할 수 있습니다.');
      }

      if (!enrollment.form) {
        throw new EnrollmentError('수강 신청서가 존재하지 않습니다.');
      }

      return await this.prisma.enrollmentForm.update({
        where: { id: enrollmentId },
        data: formData,
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw new EnrollmentError('수강 신청서 수정에 실패했습니다.', error);
    }
  }

  /**
   * 사용자가 특정 클래스에 신청했는지 확인
   */
  async hasUserEnrolled(userId: string, classId: string): Promise<boolean> {
    try {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          user_id_mclass_id: {
            user_id: userId,
            mclass_id: classId,
          },
        },
      });

      return !!enrollment;
    } catch (error) {
      throw new EnrollmentError('수강 신청 확인에 실패했습니다.', error);
    }
  }

  /**
   * 클래스의 수강 신청 수 조회
   */
  async getEnrollmentCount(classId: string): Promise<number> {
    try {
      return await this.prisma.enrollment.count({
        where: { mclass_id: classId },
      });
    } catch (error) {
      throw new EnrollmentError('수강 신청 수 조회에 실패했습니다.', error);
    }
  }
}
