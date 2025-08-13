import { BaseError } from '../BaseError.js';
import { ErrorResponse } from '../../types/api.js';

export class EnrollmentFormError extends BaseError {
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 400,
    errorCode: string = 'ENROLLMENT_FORM_ERROR',
    details?: unknown
  ) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'EnrollmentFormError';
  }

  /**
   * 표준 응답 형식으로 변환
   */
  toResponse(): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: this.errorCode,
        message: this.message,
      },
    };

    if (this.details !== undefined) {
      response.error.details = this.details;
    }

    return response;
  }

  /**
   * 지원서 양식을 찾을 수 없음
   */
  static notFound(id: string): EnrollmentFormError {
    return new EnrollmentFormError(
      `ID가 '${id}'인 지원서 양식을 찾을 수 없습니다`,
      404,
      'ENROLLMENT_FORM_NOT_FOUND',
      { id }
    );
  }

  /**
   * 이미 존재하는 지원서 양식
   */
  static alreadyExists(mclassId: string): EnrollmentFormError {
    return new EnrollmentFormError(
      `MClass ID '${mclassId}'에 이미 지원서 양식이 존재합니다`,
      409,
      'ENROLLMENT_FORM_ALREADY_EXISTS',
      { mclassId }
    );
  }

  /**
   * 권한 없음
   */
  static forbidden(): EnrollmentFormError {
    return new EnrollmentFormError(
      '이 작업을 수행할 권한이 없습니다',
      403,
      'ENROLLMENT_FORM_FORBIDDEN'
    );
  }

  /**
   * 검증 오류
   */
  static validation(details?: unknown): EnrollmentFormError {
    return new EnrollmentFormError(
      '입력 데이터가 유효하지 않습니다',
      400,
      'ENROLLMENT_FORM_VALIDATION_ERROR',
      details
    );
  }

  /**
   * 중복된 질문 ID
   */
  static duplicateQuestionIds(): EnrollmentFormError {
    return new EnrollmentFormError(
      '질문 ID가 중복되었습니다',
      400,
      'ENROLLMENT_FORM_DUPLICATE_QUESTION_IDS'
    );
  }

  /**
   * 누락된 옵션
   */
  static missingOptions(questionId: string): EnrollmentFormError {
    return new EnrollmentFormError(
      `질문 ID '${questionId}'에 옵션이 필요합니다`,
      400,
      'ENROLLMENT_FORM_MISSING_OPTIONS',
      { questionId }
    );
  }
}
