import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  CreateEnrollmentFormDto,
  UpdateEnrollmentFormDto,
  EnrollmentFormResponseInterface as EnrollmentFormResponse,
  Question,
  QuestionSchema,
} from '../../schemas/enrollmentForm/index.js';
import { EnrollmentFormError } from '../../common/exception/enrollmentForm/EnrollmentFormError.js';
import logger from '../../config/logger.config.js';

export class EnrollmentFormRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 질문 배열을 런타임 검증 후 Question[] 으로 반환
   */
  private parseQuestions(raw: unknown): Question[] {
    try {
      return z.array(QuestionSchema).parse(raw);
    } catch (error) {
      // 잘못된 형식의 데이터가 저장되어 있을 경우 빈 배열로 처리
      logger.warn(
        '⚠️ 지원서 양식의 questions 필드가 올바르지 않은 형식입니다',
        {
          error: error instanceof Error ? error.message : error,
          rawData: raw,
        }
      );
      return [];
    }
  }

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
      questions: this.parseQuestions(form.questions),
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
      questions: this.parseQuestions(form.questions),
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
      questions: this.parseQuestions(form.questions),
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

      // 업데이트 데이터 구성
      const updateData: Partial<{
        title: string;
        description: string | null;
        questions: Question[];
        isActive: boolean;
      }> = {};

      if (data.title !== undefined && data.title.trim()) {
        updateData.title = data.title.trim();
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.questions) {
        updateData.questions = data.questions;
      }
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      // 빈 업데이트 방지
      if (Object.keys(updateData).length === 0) {
        throw EnrollmentFormError.validation('업데이트할 데이터가 없습니다.');
      }

      // 트랜잭션 내에서 수정 수행
      const form = await tx.enrollmentForm.update({
        where: { mclassId },
        data: updateData,
      });

      return {
        ...form,
        questions: this.parseQuestions(form.questions),
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
