import { BaseError } from './BaseError';
import { ErrorResponse } from '../types/api.js';

export class ValidationError extends BaseError {
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 400,
    errorCode: string = 'VALIDATION_ERROR',
    details?: unknown
  ) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'ValidationError';
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

  // 인증 관련 에러
  static unauthorized(message: string = '인증이 필요합니다.'): ValidationError {
    return new ValidationError(message, 401, 'UNAUTHORIZED');
  }

  // 권한 관련 에러
  static forbidden(message: string = '접근 권한이 없습니다.'): ValidationError {
    return new ValidationError(message, 403, 'FORBIDDEN');
  }

  // 필수 필드 누락
  static missingField(fieldName: string): ValidationError {
    return new ValidationError(
      `${fieldName}이(가) 필요합니다.`,
      400,
      'MISSING_FIELD'
    );
  }

  // 잘못된 데이터 형식
  static invalidFormat(
    fieldName: string,
    expectedFormat: string
  ): ValidationError {
    return new ValidationError(
      `${fieldName}의 형식이 올바르지 않습니다. (예상 형식: ${expectedFormat})`,
      400,
      'INVALID_FORMAT'
    );
  }

  // 배열 검증
  static invalidArray(fieldName: string): ValidationError {
    return new ValidationError(
      `${fieldName}은(는) 배열이어야 합니다.`,
      400,
      'INVALID_ARRAY'
    );
  }

  // 약관 ID 목록 검증
  static invalidTermIds(): ValidationError {
    return new ValidationError(
      '약관 ID 목록이 필요합니다.',
      400,
      'INVALID_TERM_IDS'
    );
  }

  // 리소스를 찾을 수 없음
  static notFound(
    message: string = '리소스를 찾을 수 없습니다.'
  ): ValidationError {
    return new ValidationError(message, 404, 'NOT_FOUND');
  }

  // 잘못된 요청
  static badRequest(message: string = '잘못된 요청입니다.'): ValidationError {
    return new ValidationError(message, 400, 'BAD_REQUEST');
  }

  // 내부 서버 오류
  static internalServerError(
    message: string = '내부 서버 오류가 발생했습니다.'
  ): ValidationError {
    return new ValidationError(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}
