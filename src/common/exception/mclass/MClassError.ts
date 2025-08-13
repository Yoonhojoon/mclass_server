import { BaseError } from '../BaseError.js';
import { ErrorResponse } from '../../types/api.js';

export class MClassError extends BaseError {
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 400,
    errorCode: string = 'MCLASS_ERROR',
    details?: unknown
  ) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'MClassError';
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
   * MClass를 찾을 수 없음
   */
  static notFound(id: string): MClassError {
    return new MClassError(
      `ID가 '${id}'인 MClass를 찾을 수 없습니다`,
      404,
      'MCLASS_NOT_FOUND',
      { id }
    );
  }

  /**
   * 시간 설정이 유효하지 않음
   */
  static invalidTime(details?: unknown): MClassError {
    return new MClassError(
      '시간 설정이 유효하지 않습니다',
      400,
      'MCLASS_INVALID_TIME',
      details
    );
  }

  /**
   * 권한 없음
   */
  static forbidden(): MClassError {
    return new MClassError(
      '이 작업을 수행할 권한이 없습니다',
      403,
      'MCLASS_FORBIDDEN'
    );
  }

  /**
   * 권한 없음 (상세 메시지)
   */
  static permissionDenied(action: string, resource: string): MClassError {
    return new MClassError(
      `${action}에 대한 ${resource} 권한이 없습니다`,
      403,
      'MCLASS_PERMISSION_DENIED',
      { action, resource }
    );
  }

  /**
   * 검증 오류
   */
  static validation(details?: unknown): MClassError {
    return new MClassError(
      '입력 데이터가 유효하지 않습니다',
      400,
      'MCLASS_VALIDATION_ERROR',
      details
    );
  }

  /**
   * 중복 제목
   */
  static duplicateTitle(title: string): MClassError {
    return new MClassError(
      `제목 '${title}'이 이미 사용 중입니다`,
      409,
      'MCLASS_DUPLICATE_TITLE',
      { title }
    );
  }

  /**
   * 모집 중인 클래스 수정 불가
   */
  static cannotModifyRecruiting(id: string): MClassError {
    return new MClassError(
      '모집 중인 클래스는 수정할 수 없습니다',
      400,
      'MCLASS_CANNOT_MODIFY_RECRUITING',
      { id }
    );
  }

  /**
   * 진행 중인 클래스 삭제 불가
   */
  static cannotDeleteInProgress(id: string): MClassError {
    return new MClassError(
      '진행 중인 클래스는 삭제할 수 없습니다',
      400,
      'MCLASS_CANNOT_DELETE_IN_PROGRESS',
      { id }
    );
  }
}
