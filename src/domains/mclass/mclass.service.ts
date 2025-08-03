import { PrismaClient, MClass } from '@prisma/client';
import { BaseError } from '../../common/exception/BaseError';
import { ClassError } from '../../common/exception/class/ClassError';

export class MClassService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 모든 클래스 목록 조회
   */
  async getAllClasses(): Promise<MClass[]> {
    try {
      return await this.prisma.mClass.findMany({
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          enrollments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    } catch (error) {
      throw new ClassError('클래스 목록 조회에 실패했습니다.', error);
    }
  }

  /**
   * 특정 클래스 조회
   */
  async getClassById(id: string): Promise<MClass | null> {
    try {
      return await this.prisma.mClass.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          enrollments: {
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
          },
        },
      });
    } catch (error) {
      throw new ClassError('클래스 조회에 실패했습니다.', error);
    }
  }

  /**
   * 사용자가 생성한 클래스 목록 조회
   */
  async getClassesByCreator(creatorId: string): Promise<MClass[]> {
    try {
      return await this.prisma.mClass.findMany({
        where: { created_by: creatorId },
        include: {
          enrollments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    } catch (error) {
      throw new ClassError('사용자의 클래스 목록 조회에 실패했습니다.', error);
    }
  }

  /**
   * 새 클래스 생성
   */
  async createClass(classData: {
    title: string;
    description?: string;
    capacity: number;
    start_at: Date;
    end_at: Date;
    created_by: string;
  }): Promise<MClass> {
    try {
      // 시작일이 종료일보다 늦으면 안됨
      if (classData.start_at >= classData.end_at) {
        throw new ClassError('시작일은 종료일보다 빨라야 합니다.');
      }

      // 수용 인원은 1명 이상이어야 함
      if (classData.capacity < 1) {
        throw new ClassError('수용 인원은 1명 이상이어야 합니다.');
      }

      return await this.prisma.mClass.create({
        data: classData,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw new ClassError('클래스 생성에 실패했습니다.', error);
    }
  }

  /**
   * 클래스 정보 수정
   */
  async updateClass(
    id: string,
    updateData: {
      title?: string;
      description?: string;
      capacity?: number;
      start_at?: Date;
      end_at?: Date;
    }
  ): Promise<MClass> {
    try {
      const existingClass = await this.prisma.mClass.findUnique({
        where: { id },
      });

      if (!existingClass) {
        throw new ClassError('존재하지 않는 클래스입니다.');
      }

      // 시작일과 종료일 검증
      if (updateData.start_at && updateData.end_at) {
        if (updateData.start_at >= updateData.end_at) {
          throw new ClassError('시작일은 종료일보다 빨라야 합니다.');
        }
      } else if (updateData.start_at) {
        if (updateData.start_at >= existingClass.end_at) {
          throw new ClassError('시작일은 종료일보다 빨라야 합니다.');
        }
      } else if (updateData.end_at) {
        if (existingClass.start_at >= updateData.end_at) {
          throw new ClassError('시작일은 종료일보다 빨라야 합니다.');
        }
      }

      // 수용 인원 검증
      if (updateData.capacity && updateData.capacity < 1) {
        throw new ClassError('수용 인원은 1명 이상이어야 합니다.');
      }

      return await this.prisma.mClass.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw new ClassError('클래스 수정에 실패했습니다.', error);
    }
  }

  /**
   * 클래스 삭제
   */
  async deleteClass(id: string): Promise<void> {
    try {
      const existingClass = await this.prisma.mClass.findUnique({
        where: { id },
        include: {
          enrollments: true,
        },
      });

      if (!existingClass) {
        throw new ClassError('존재하지 않는 클래스입니다.');
      }

      // 수강생이 있으면 삭제 불가
      if (existingClass.enrollments.length > 0) {
        throw new ClassError('수강생이 있는 클래스는 삭제할 수 없습니다.');
      }

      await this.prisma.mClass.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw new ClassError('클래스 삭제에 실패했습니다.', error);
    }
  }

  /**
   * 클래스 수강생 수 조회
   */
  async getEnrollmentCount(classId: string): Promise<number> {
    try {
      return await this.prisma.enrollment.count({
        where: { mclass_id: classId },
      });
    } catch (error) {
      throw new ClassError('수강생 수 조회에 실패했습니다.', error);
    }
  }

  /**
   * 클래스 수용 가능 여부 확인
   */
  async isClassAvailable(classId: string): Promise<boolean> {
    try {
      const classInfo = await this.prisma.mClass.findUnique({
        where: { id: classId },
        include: {
          enrollments: true,
        },
      });

      if (!classInfo) {
        return false;
      }

      return classInfo.enrollments.length < classInfo.capacity;
    } catch (error) {
      throw new ClassError('클래스 수용 가능 여부 확인에 실패했습니다.', error);
    }
  }
}
