import { EnrollmentFormRepository } from './enrollmentForm.repository.js';
import {
  CreateEnrollmentFormDto,
  UpdateEnrollmentFormDto,
  EnrollmentFormResponseInterface as EnrollmentFormResponse,
  Question,
} from '../../schemas/enrollmentForm/index.js';
import { EnrollmentFormError } from '../../common/exception/enrollmentForm/EnrollmentFormError.js';
import logger from '../../config/logger.config.js';

export class EnrollmentFormService {
  constructor(private repository: EnrollmentFormRepository) {}

  /**
   * MClass ID로 지원서 양식 조회
   */
  async findByMClassId(mclassId: string): Promise<EnrollmentFormResponse> {
    logger.info(
      `[EnrollmentFormService] MClass ID로 지원서 양식 조회 시작: ${mclassId}`
    );

    try {
      const form = await this.repository.findByMClassId(mclassId);
      if (!form) {
        logger.warn(
          `[EnrollmentFormService] MClass ID에 해당하는 지원서 양식을 찾을 수 없음: ${mclassId}`
        );
        throw EnrollmentFormError.notFound(mclassId);
      }

      logger.info(
        `[EnrollmentFormService] MClass ID로 지원서 양식 조회 성공: ${mclassId}`
      );
      return form;
    } catch (error) {
      logger.error(
        `[EnrollmentFormService] MClass ID로 지원서 양식 조회 실패: ${mclassId}`,
        { error: error instanceof Error ? error.message : error }
      );
      throw error;
    }
  }

  /**
   * 지원서 양식 ID로 조회
   */
  async findById(id: string): Promise<EnrollmentFormResponse> {
    logger.info(`[EnrollmentFormService] 지원서 양식 ID로 조회 시작: ${id}`);

    try {
      const form = await this.repository.findById(id);
      if (!form) {
        logger.warn(
          `[EnrollmentFormService] 지원서 양식을 찾을 수 없음: ${id}`
        );
        throw EnrollmentFormError.notFound(id);
      }

      logger.info(`[EnrollmentFormService] 지원서 양식 ID로 조회 성공: ${id}`);
      return form;
    } catch (error) {
      logger.error(
        `[EnrollmentFormService] 지원서 양식 ID로 조회 실패: ${id}`,
        { error: error instanceof Error ? error.message : error }
      );
      throw error;
    }
  }

  /**
   * 지원서 양식 생성
   */
  async create(
    mclassId: string,
    data: CreateEnrollmentFormDto
  ): Promise<EnrollmentFormResponse> {
    logger.info(
      `[EnrollmentFormService] 지원서 양식 생성 시작: MClass ID ${mclassId}`
    );

    try {
      // 이미 해당 MClass에 지원서 양식이 있는지 확인
      const exists = await this.repository.existsByMClassId(mclassId);
      if (exists) {
        logger.warn(
          `[EnrollmentFormService] MClass에 이미 지원서 양식이 존재함: ${mclassId}`
        );
        throw EnrollmentFormError.alreadyExists(mclassId);
      }

      // 질문 ID 중복 검증
      const questionIds = data.questions.map(q => q.id);
      const uniqueIds = new Set(questionIds);
      if (questionIds.length !== uniqueIds.size) {
        logger.warn(`[EnrollmentFormService] 중복된 질문 ID 발견: ${mclassId}`);
        throw EnrollmentFormError.duplicateQuestionIds();
      }

      // 필수 필드가 있는 radio/checkbox/select 타입 검증
      for (const question of data.questions) {
        if (['radio', 'checkbox', 'select'].includes(question.type)) {
          // agreeTerms ID는 약관 동의용이므로 옵션 검증 제외
          if (question.id === 'agreeTerms') {
            continue;
          }

          if (!question.options || question.options.length === 0) {
            logger.warn(
              `[EnrollmentFormService] 질문에 옵션이 누락됨: ${question.id}, MClass ID: ${mclassId}`
            );
            throw EnrollmentFormError.missingOptions(question.id);
          }
        }
      }

      const result = await this.repository.create(mclassId, data);
      logger.info(
        `[EnrollmentFormService] 지원서 양식 생성 성공: MClass ID ${mclassId}, 양식 ID ${result.id}`
      );
      return result;
    } catch (error) {
      logger.error(
        `[EnrollmentFormService] 지원서 양식 생성 실패: MClass ID ${mclassId}`,
        { error: error instanceof Error ? error.message : error }
      );
      throw error;
    }
  }

  /**
   * 지원서 양식 수정 (ID로 - 테스트용)
   */
  async update(
    id: string,
    data: UpdateEnrollmentFormDto
  ): Promise<EnrollmentFormResponse> {
    logger.info(`[EnrollmentFormService] 지원서 양식 수정 시작: ${id}`);

    try {
      // 지원서 양식 존재 확인
      const existingForm = await this.repository.findById(id);
      if (!existingForm) {
        logger.warn(
          `[EnrollmentFormService] 수정할 지원서 양식을 찾을 수 없음: ${id}`
        );
        throw EnrollmentFormError.notFound(id);
      }

      // 질문이 제공된 경우 검증
      if (data.questions) {
        // 질문 ID 중복 검증
        const questionIds = data.questions.map((q: Question) => q.id);
        const uniqueIds = new Set(questionIds);
        if (questionIds.length !== uniqueIds.size) {
          logger.warn(`[EnrollmentFormService] 중복된 질문 ID 발견: ${id}`);
          throw EnrollmentFormError.duplicateQuestionIds();
        }

        // 필수 필드가 있는 radio/checkbox/select 타입 검증
        for (const question of data.questions) {
          if (['radio', 'checkbox', 'select'].includes(question.type)) {
            // agreeTerms ID는 약관 동의용이므로 옵션 검증 제외
            if (question.id === 'agreeTerms') {
              continue;
            }

            if (!question.options || question.options.length === 0) {
              logger.warn(
                `[EnrollmentFormService] 질문에 옵션이 누락됨: ${question.id}, 양식 ID: ${id}`
              );
              throw EnrollmentFormError.missingOptions(question.id);
            }
          }
        }
      }

      // MClass ID로 트랜잭션 업데이트 수행
      const result = await this.repository.updateByMClassId(
        existingForm.mclassId,
        data
      );
      logger.info(`[EnrollmentFormService] 지원서 양식 수정 성공: ${id}`);
      return result;
    } catch (error) {
      logger.error(`[EnrollmentFormService] 지원서 양식 수정 실패: ${id}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * MClass ID로 지원서 양식 수정 (트랜잭션 처리)
   */
  async updateByMClassId(
    mclassId: string,
    data: UpdateEnrollmentFormDto
  ): Promise<EnrollmentFormResponse> {
    logger.info(
      `[EnrollmentFormService] MClass ID로 지원서 양식 수정 시작: ${mclassId}`
    );

    try {
      // 트랜잭션 내에서 조회 및 수정 수행
      const result = await this.repository.updateByMClassId(mclassId, data);

      logger.info(
        `[EnrollmentFormService] MClass ID로 지원서 양식 수정 성공: ${mclassId}`
      );
      return result;
    } catch (error) {
      logger.error(
        `[EnrollmentFormService] MClass ID로 지원서 양식 수정 실패: ${mclassId}`,
        { error: error instanceof Error ? error.message : error }
      );
      throw error;
    }
  }

  /**
   * MClass ID로 지원서 양식 삭제 (트랜잭션 처리)
   */
  async deleteByMClassId(mclassId: string): Promise<void> {
    logger.info(
      `[EnrollmentFormService] MClass ID로 지원서 양식 삭제 시작: ${mclassId}`
    );

    try {
      // 트랜잭션 내에서 조회 및 삭제 수행
      await this.repository.deleteByMClassId(mclassId);

      logger.info(
        `[EnrollmentFormService] MClass ID로 지원서 양식 삭제 성공: ${mclassId}`
      );
    } catch (error) {
      logger.error(
        `[EnrollmentFormService] MClass ID로 지원서 양식 삭제 실패: ${mclassId}`,
        { error: error instanceof Error ? error.message : error }
      );
      throw error;
    }
  }

  /**
   * 지원서 양식 삭제 (ID로)
   */
  async delete(id: string): Promise<void> {
    logger.info(`[EnrollmentFormService] 지원서 양식 삭제 시작: ${id}`);

    try {
      // 지원서 양식 존재 확인
      const existingForm = await this.repository.findById(id);
      if (!existingForm) {
        logger.warn(
          `[EnrollmentFormService] 삭제할 지원서 양식을 찾을 수 없음: ${id}`
        );
        throw EnrollmentFormError.notFound(id);
      }

      // MClass ID로 트랜잭션 삭제 수행
      await this.repository.deleteByMClassId(existingForm.mclassId);
      logger.info(`[EnrollmentFormService] 지원서 양식 삭제 성공: ${id}`);
    } catch (error) {
      logger.error(`[EnrollmentFormService] 지원서 양식 삭제 실패: ${id}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}
