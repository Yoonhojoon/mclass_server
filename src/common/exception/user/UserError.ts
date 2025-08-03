import { BaseError } from '../BaseError.js';

export class UserError extends BaseError {
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 400,
    errorCode: string = 'USER_ERROR',
    details?: any
  ) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'UserError';
  }

  static notFound(userId?: string) {
    const message = userId
      ? `사용자 ID ${userId}를 찾을 수 없습니다.`
      : '사용자를 찾을 수 없습니다.';
    return new UserError(message, 404, 'USER_NOT_FOUND');
  }

  static alreadyExists(email: string) {
    return new UserError(`이미 등록된 이메일입니다: ${email}`, 409, 'USER_ALREADY_EXISTS');
  }

  static validationError(message: string) {
    return new UserError(`사용자 데이터 검증 오류: ${message}`, 400, 'USER_VALIDATION_ERROR');
  }

  static passwordMismatch() {
    return new UserError('비밀번호가 일치하지 않습니다.', 401, 'USER_PASSWORD_MISMATCH');
  }

  static invalidPassword() {
    return new UserError('유효하지 않은 비밀번호입니다.', 400, 'USER_INVALID_PASSWORD');
  }

  static invalidEmail() {
    return new UserError('유효하지 않은 이메일 형식입니다.', 400, 'USER_INVALID_EMAIL');
  }

  static invalidProvider() {
    return new UserError('지원하지 않는 로그인 방식입니다.', 400, 'USER_INVALID_PROVIDER');
  }

  static inactive() {
    return new UserError('비활성화된 사용자입니다.', 403, 'USER_INACTIVE');
  }

  static profileUpdateError(message: string) {
    return new UserError(`프로필 업데이트 오류: ${message}`, 400, 'USER_PROFILE_UPDATE_ERROR');
  }

  static creationFailed(message: string = '사용자 생성에 실패했습니다.') {
    return new UserError(message, 500, 'USER_CREATION_FAILED');
  }

  static updateFailed(message: string = '사용자 정보 업데이트에 실패했습니다.') {
    return new UserError(message, 500, 'USER_UPDATE_FAILED');
  }

  static deletionFailed(message: string = '사용자 삭제에 실패했습니다.') {
    return new UserError(message, 500, 'USER_DELETION_FAILED');
  }
} 