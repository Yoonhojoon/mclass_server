import { PrismaClient } from '@prisma/client';
import { CreateEnrollmentFormDto } from './dto/CreateEnrollmentFormDto.js';
import { UpdateEnrollmentFormDto } from './dto/UpdateEnrollmentFormDto.js';
import { EnrollmentFormResponse } from './dto/EnrollmentFormResponse.js';

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
   * 지원서 양식 수정
   */
  async update(
    id: string,
    data: UpdateEnrollmentFormDto
  ): Promise<EnrollmentFormResponse> {
    const form = await this.prisma.enrollmentForm.update({
      where: { id },
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
  }

  /**
   * 지원서 양식 삭제
   */
  async delete(id: string): Promise<void> {
    await this.prisma.enrollmentForm.delete({
      where: { id },
    });
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
}
