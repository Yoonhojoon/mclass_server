import { BaseError } from '../BaseError.js';
import { ErrorResponse } from '../../types/api.js';

export class AdminError extends BaseError {
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 400,
    errorCode: string = 'ADMIN_ERROR',
    details?: unknown
  ) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'AdminError';
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

  static notFound(adminId?: string): AdminError {
    const message = adminId
      ? `관리자 ID ${adminId}를 찾을 수 없습니다.`
      : '관리자를 찾을 수 없습니다.';
    return new AdminError(message, 404, 'ADMIN_NOT_FOUND');
  }

  static insufficientPermissions(requiredPermission: string): AdminError {
    return new AdminError(
      `권한이 부족합니다. 필요한 권한: ${requiredPermission}`,
      403,
      'ADMIN_INSUFFICIENT_PERMISSIONS'
    );
  }

  static cannotModifyInitialAdmin(): AdminError {
    return new AdminError(
      '초기 관리자 권한은 변경할 수 없습니다.',
      403,
      'ADMIN_CANNOT_MODIFY_INITIAL_ADMIN'
    );
  }

  static cannotModifySelf(): AdminError {
    return new AdminError(
      '자신의 권한은 변경할 수 없습니다.',
      403,
      'ADMIN_CANNOT_MODIFY_SELF'
    );
  }

  static minimumAdminRequired(): AdminError {
    return new AdminError(
      '최소 1명의 관리자가 필요합니다.',
      403,
      'ADMIN_MINIMUM_ADMIN_REQUIRED'
    );
  }

  static roleUpdateFailed(userId: string, reason?: string): AdminError {
    const message = `사용자 ${userId}의 권한 변경에 실패했습니다.${reason ? ` 사유: ${reason}` : ''}`;
    return new AdminError(message, 500, 'ADMIN_ROLE_UPDATE_FAILED');
  }

  static userNotFound(userId: string): AdminError {
    return new AdminError(
      `사용자 ID ${userId}를 찾을 수 없습니다.`,
      404,
      'ADMIN_USER_NOT_FOUND'
    );
  }

  static invalidRole(role: string): AdminError {
    return new AdminError(
      `유효하지 않은 역할입니다: ${role}`,
      400,
      'ADMIN_INVALID_ROLE'
    );
  }

  static auditLogFailed(operation: string): AdminError {
    return new AdminError(
      `감사 로그 기록에 실패했습니다: ${operation}`,
      500,
      'ADMIN_AUDIT_LOG_FAILED'
    );
  }

  static accessDenied(resource: string): AdminError {
    return new AdminError(
      `${resource}에 대한 접근이 거부되었습니다.`,
      403,
      'ADMIN_ACCESS_DENIED'
    );
  }

  static operationFailed(operation: string, reason?: string): AdminError {
    const message = `관리자 작업 실패: ${operation}${reason ? ` - ${reason}` : ''}`;
    return new AdminError(message, 500, 'ADMIN_OPERATION_FAILED');
  }

  static validationError(message: string): AdminError {
    return new AdminError(
      `관리자 데이터 검증 오류: ${message}`,
      400,
      'ADMIN_VALIDATION_ERROR'
    );
  }

  static userListRetrievalFailed(): AdminError {
    return new AdminError(
      '사용자 목록 조회에 실패했습니다.',
      500,
      'ADMIN_USER_LIST_RETRIEVAL_FAILED'
    );
  }

  static adminCountRetrievalFailed(): AdminError {
    return new AdminError(
      '관리자 수 조회에 실패했습니다.',
      500,
      'ADMIN_COUNT_RETRIEVAL_FAILED'
    );
  }
}
