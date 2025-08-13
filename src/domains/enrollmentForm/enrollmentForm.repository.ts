import { PrismaClient } from '@prisma/client';
import {
  CreateEnrollmentFormDto,
  UpdateEnrollmentFormDto,
  EnrollmentFormResponseInterface as EnrollmentFormResponse,
} from '../../schemas/enrollmentForm/index.js';
import { EnrollmentFormError } from '../../common/exception/enrollmentForm/EnrollmentFormError.js';

export class EnrollmentFormRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * MClass ID로 지원서 양식 조회
   */
  async findByMClassId(
    mclassId: string
  ): Promise<EnrollmentFormResponse | null> {
    const form = await this.prisma.enrollmentForm.findUnique({
      where: { mclassId },
    });

    if (!form) return null;

    return {
      ...form,
      questions: form.questions as any,
    };
  }

  /**
   * 지원서 양식 ID로 조회
   */
  async findById(id: string): Promise<EnrollmentFormResponse | null> {
    const form = await this.prisma.enrollmentForm.findUnique({
      where: { id },
    });

    if (!form) return null;

    return {
      ...form,
      questions: form.questions as any,
    };
  }

  /**
   * 지원서 양식 생성
   */
  async create(
    mclassId: string,
    data: CreateEnrollmentFormDto
  ): Promise<EnrollmentFormResponse> {
    const form = await this.prisma.enrollmentForm.create({
      data: {
        mclassId,
        title: data.title,
        description: data.description,
        questions: data.questions,
        isActive: data.isActive,
      },
    });

    return {
      ...form,
      questions: form.questions as any,
    };
  }

  /**
   * MClass ID로 지원서 양식 존재 여부 확인
   */
  async existsByMClassId(mclassId: string): Promise<boolean> {
    const count = await this.prisma.enrollmentForm.count({
      where: { mclassId },
    });
    return count > 0;
  }

  /**
   * MClass ID로 지원서 양식 수정 (트랜잭션 처리)
   */
  async updateByMClassId(
    mclassId: string,
    data: UpdateEnrollmentFormDto
  ): Promise<EnrollmentFormResponse> {
    return await this.prisma.$transaction(async tx => {
      // 먼저 양식 존재 확인
      const existingForm = await tx.enrollmentForm.findUnique({
        where: { mclassId },
      });

      if (!existingForm) {
        throw EnrollmentFormError.notFound(mclassId);
      }

      // 트랜잭션 내에서 수정 수행
      const form = await tx.enrollmentForm.update({
        where: { mclassId },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.questions && { questions: data.questions }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      return {
        ...form,
        questions: form.questions as any,
      };
    });
  }

  /**
   * MClass ID로 지원서 양식 삭제 (트랜잭션 처리)
   */
  async deleteByMClassId(mclassId: string): Promise<void> {
    await this.prisma.$transaction(async tx => {
      // 먼저 양식 존재 확인
      const existingForm = await tx.enrollmentForm.findUnique({
        where: { mclassId },
      });

      if (!existingForm) {
        throw EnrollmentFormError.notFound(mclassId);
      }

      // 트랜잭션 내에서 삭제 수행
      await tx.enrollmentForm.delete({
        where: { mclassId },
      });
    });
  }
}
