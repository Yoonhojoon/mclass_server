import { BaseError } from '../BaseError';
import { ErrorResponse } from '../../types/api.js';

export class TermError extends BaseError {
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 400,
    errorCode: string = 'TERM_ERROR',
    details?: unknown
  ) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'TermError';
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

  // 약관 조회 관련 에러
  static notFound(termId?: string): TermError {
    const message = termId
      ? `약관 ID ${termId}를 찾을 수 없습니다.`
      : '약관을 찾을 수 없습니다.';
    return new TermError(message, 404, 'TERM_NOT_FOUND');
  }

  static typeNotFound(termType: string): TermError {
    return new TermError(
      `약관 유형 '${termType}'을 찾을 수 없습니다.`,
      404,
      'TERM_TYPE_NOT_FOUND'
    );
  }

  static latestVersionNotFound(termType: string): TermError {
    return new TermError(
      `최신 버전의 ${termType} 약관을 찾을 수 없습니다.`,
      404,
      'TERM_LATEST_VERSION_NOT_FOUND'
    );
  }

  // 약관 생성/수정 관련 에러
  static creationFailed(
    message: string = '약관 생성에 실패했습니다.'
  ): TermError {
    return new TermError(message, 500, 'TERM_CREATION_FAILED');
  }

  static updateFailed(
    message: string = '약관 수정에 실패했습니다.'
  ): TermError {
    return new TermError(message, 500, 'TERM_UPDATE_FAILED');
  }

  static deletionFailed(
    message: string = '약관 삭제에 실패했습니다.'
  ): TermError {
    return new TermError(message, 500, 'TERM_DELETION_FAILED');
  }

  static validationError(message: string): TermError {
    return new TermError(
      `약관 데이터 검증 오류: ${message}`,
      400,
      'TERM_VALIDATION_ERROR'
    );
  }

  static invalidType(termType: string): TermError {
    return new TermError(
      `유효하지 않은 약관 유형입니다: ${termType}`,
      400,
      'TERM_INVALID_TYPE'
    );
  }

  static invalidVersion(version: string): TermError {
    return new TermError(
      `유효하지 않은 버전 형식입니다: ${version}`,
      400,
      'TERM_INVALID_VERSION'
    );
  }

  static duplicateVersion(version: string, termType: string): TermError {
    return new TermError(
      `이미 존재하는 버전입니다: ${version} (${termType})`,
      409,
      'TERM_DUPLICATE_VERSION'
    );
  }

  // 약관 삭제 제한 관련 에러
  static cannotDeleteWithAgreements(): TermError {
    return new TermError(
      '사용자 동의 기록이 있는 약관은 삭제할 수 없습니다.',
      409,
      'TERM_CANNOT_DELETE_WITH_AGREEMENTS'
    );
  }

  // 약관 동의 관련 에러
  static alreadyAgreed(userId: string, termId: string): TermError {
    return new TermError(
      `사용자 ${userId}가 이미 약관 ${termId}에 동의했습니다.`,
      409,
      'TERM_ALREADY_AGREED'
    );
  }

  static agreementFailed(
    message: string = '약관 동의에 실패했습니다.'
  ): TermError {
    return new TermError(message, 500, 'TERM_AGREEMENT_FAILED');
  }

  static agreementNotFound(userId: string, termId: string): TermError {
    return new TermError(
      `사용자 ${userId}의 약관 ${termId} 동의 기록을 찾을 수 없습니다.`,
      404,
      'TERM_AGREEMENT_NOT_FOUND'
    );
  }

  // 필수 약관 관련 에러
  static requiredTermsNotAgreed(missingTerms: string[]): TermError {
    const termsList = missingTerms.join(', ');
    return new TermError(
      `다음 필수 약관에 동의하지 않았습니다: ${termsList}`,
      400,
      'TERM_REQUIRED_NOT_AGREED'
    );
  }

  static requiredTermsNotFound(): TermError {
    return new TermError(
      '필수 약관을 찾을 수 없습니다.',
      404,
      'TERM_REQUIRED_NOT_FOUND'
    );
  }

  // 약관 목록 조회 관련 에러
  static listRetrievalFailed(
    message: string = '약관 목록 조회에 실패했습니다.'
  ): TermError {
    return new TermError(message, 500, 'TERM_LIST_RETRIEVAL_FAILED');
  }

  static userAgreementsRetrievalFailed(
    message: string = '사용자 약관 동의 목록 조회에 실패했습니다.'
  ): TermError {
    return new TermError(message, 500, 'TERM_USER_AGREEMENTS_RETRIEVAL_FAILED');
  }

  // 약관 확인 관련 에러
  static agreementCheckFailed(
    message: string = '약관 동의 확인에 실패했습니다.'
  ): TermError {
    return new TermError(message, 500, 'TERM_AGREEMENT_CHECK_FAILED');
  }

  static requiredAgreementCheckFailed(
    message: string = '필수 약관 동의 확인에 실패했습니다.'
  ): TermError {
    return new TermError(message, 500, 'TERM_REQUIRED_AGREEMENT_CHECK_FAILED');
  }

  // 일반적인 데이터베이스 에러
  static databaseError(operation: string, originalError?: unknown): TermError {
    return new TermError(
      `약관 ${operation} 중 데이터베이스 오류가 발생했습니다.`,
      500,
      'TERM_DATABASE_ERROR',
      originalError
    );
  }

  // 권한 관련 에러
  static insufficientPermissions(operation: string): TermError {
    return new TermError(
      `약관 ${operation}에 대한 권한이 없습니다.`,
      403,
      'TERM_INSUFFICIENT_PERMISSIONS'
    );
  }

  // 시스템 에러
  static systemError(
    message: string = '약관 처리 중 시스템 오류가 발생했습니다.'
  ): TermError {
    return new TermError(message, 500, 'TERM_SYSTEM_ERROR');
  }
}
