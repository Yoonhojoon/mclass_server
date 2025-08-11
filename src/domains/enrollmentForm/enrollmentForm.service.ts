import { EnrollmentFormRepository } from './enrollmentForm.repository.js';
import { CreateEnrollmentFormDto } from './dto/CreateEnrollmentFormDto.js';
import { UpdateEnrollmentFormDto } from './dto/UpdateEnrollmentFormDto.js';
import { EnrollmentFormResponse } from './dto/EnrollmentFormResponse.js';
import { EnrollmentFormError } from '../../common/exception/enrollment-form/EnrollmentFormError.js';

export class EnrollmentFormService {
  constructor(private repository: EnrollmentFormRepository) {}

  /**
   * MClass ID로 지원서 양식 조회
   */
  async findByMClassId(mclassId: string): Promise<EnrollmentFormResponse> {
    const form = await this.repository.findByMClassId(mclassId);
    if (!form) {
      throw EnrollmentFormError.notFound(mclassId);
    }
    return form;
  }

  /**
   * 지원서 양식 ID로 조회
   */
  async findById(id: string): Promise<EnrollmentFormResponse> {
    const form = await this.repository.findById(id);
    if (!form) {
      throw EnrollmentFormError.notFound(id);
    }
    return form;
  }

  /**
   * 지원서 양식 생성
   */
  async create(
    mclassId: string,
    data: CreateEnrollmentFormDto
  ): Promise<EnrollmentFormResponse> {
    // 이미 해당 MClass에 지원서 양식이 있는지 확인
    const exists = await this.repository.existsByMClassId(mclassId);
    if (exists) {
      throw EnrollmentFormError.alreadyExists(mclassId);
    }

    // 질문 ID 중복 검증
    const questionIds = data.questions.map(q => q.id);
    const uniqueIds = new Set(questionIds);
    if (questionIds.length !== uniqueIds.size) {
      throw EnrollmentFormError.duplicateQuestionIds();
    }

    // 필수 필드가 있는 radio/checkbox/select 타입 검증
    for (const question of data.questions) {
      if (['radio', 'checkbox', 'select'].includes(question.type)) {
        if (!question.options || question.options.length === 0) {
          throw EnrollmentFormError.missingOptions(question.id);
        }
      }
    }

    return this.repository.create(mclassId, data);
  }

  /**
   * 지원서 양식 수정
   */
  async update(
    id: string,
    data: UpdateEnrollmentFormDto
  ): Promise<EnrollmentFormResponse> {
    // 지원서 양식 존재 확인
    const existingForm = await this.repository.findById(id);
    if (!existingForm) {
      throw EnrollmentFormError.notFound(id);
    }

    // 질문이 제공된 경우 검증
    if (data.questions) {
      // 질문 ID 중복 검증
      const questionIds = data.questions.map(q => q.id);
      const uniqueIds = new Set(questionIds);
      if (questionIds.length !== uniqueIds.size) {
        throw EnrollmentFormError.duplicateQuestionIds();
      }

      // 필수 필드가 있는 radio/checkbox/select 타입 검증
      for (const question of data.questions) {
        if (['radio', 'checkbox', 'select'].includes(question.type)) {
          if (!question.options || question.options.length === 0) {
            throw EnrollmentFormError.missingOptions(question.id);
          }
        }
      }
    }

    return this.repository.update(id, data);
  }

  /**
   * 지원서 양식 삭제
   */
  async delete(id: string): Promise<void> {
    // 지원서 양식 존재 확인
    const existingForm = await this.repository.findById(id);
    if (!existingForm) {
      throw EnrollmentFormError.notFound(id);
    }

    await this.repository.delete(id);
  }
}
