import { BaseSuccess } from '../BaseSuccess.js';

export class UserSuccess<T = unknown> extends BaseSuccess<T> {
  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'USER_SUCCESS',
    data?: T,
    meta?: Record<string, unknown>
  ) {
    super(message, statusCode, successCode, data, meta);
  }

  static signupSuccess<T = unknown>(userId: string, data?: T): UserSuccess<T> {
    const message = `회원가입이 성공적으로 완료되었습니다. (사용자 ID: ${userId})`;
    return new UserSuccess<T>(message, 201, 'USER_SIGNUP_SUCCESS', data);
  }

  static emailVerificationSent(email: string): UserSuccess<null> {
    const message = `이메일 인증 링크가 ${email}로 발송되었습니다.`;
    return new UserSuccess<null>(message, 200, 'EMAIL_VERIFICATION_SENT', null);
  }

  static emailVerificationSuccess(email: string): UserSuccess<null> {
    const message = `${email} 이메일 인증이 완료되었습니다.`;
    return new UserSuccess<null>(
      message,
      200,
      'EMAIL_VERIFICATION_SUCCESS',
      null
    );
  }

  static profileUpdateSuccess<T = unknown>(
    field: string,
    data?: T
  ): UserSuccess<T> {
    const message = `${field}이(가) 성공적으로 업데이트되었습니다.`;
    return new UserSuccess<T>(message, 200, 'PROFILE_UPDATE_SUCCESS', data);
  }

  static profileGetSuccess<T = unknown>(data?: T): UserSuccess<T> {
    const message = '프로필 정보를 성공적으로 조회했습니다.';
    return new UserSuccess<T>(message, 200, 'PROFILE_GET_SUCCESS', data);
  }

  static passwordChangeSuccess(): UserSuccess<null> {
    const message = '비밀번호가 성공적으로 변경되었습니다.';
    return new UserSuccess<null>(message, 200, 'PASSWORD_CHANGE_SUCCESS', null);
  }

  static passwordResetEmailSent(email: string): UserSuccess<null> {
    const message = `비밀번호 재설정 이메일이 ${email}로 발송되었습니다.`;
    return new UserSuccess<null>(
      message,
      200,
      'PASSWORD_RESET_EMAIL_SENT',
      null
    );
  }

  static passwordResetSuccess(): UserSuccess<null> {
    const message = '비밀번호가 성공적으로 재설정되었습니다.';
    return new UserSuccess<null>(message, 200, 'PASSWORD_RESET_SUCCESS', null);
  }

  static accountDeleteSuccess(): UserSuccess<null> {
    const message = '계정이 성공적으로 삭제되었습니다.';
    return new UserSuccess<null>(message, 200, 'ACCOUNT_DELETE_SUCCESS', null);
  }

  static accountActivationSuccess(): UserSuccess<null> {
    const message = '계정이 성공적으로 활성화되었습니다.';
    return new UserSuccess<null>(
      message,
      200,
      'ACCOUNT_ACTIVATION_SUCCESS',
      null
    );
  }

  static accountDeactivationSuccess(): UserSuccess<null> {
    const message = '계정이 성공적으로 비활성화되었습니다.';
    return new UserSuccess<null>(
      message,
      200,
      'ACCOUNT_DEACTIVATION_SUCCESS',
      null
    );
  }

  static usersFetchSuccess<T = unknown>(
    count: number,
    data?: T
  ): UserSuccess<T> {
    const message = `총 ${count}명의 사용자를 성공적으로 조회했습니다.`;
    return new UserSuccess<T>(message, 200, 'USERS_FETCH_SUCCESS', data, {
      count,
    });
  }

  static userDetailsFetchSuccess<T = unknown>(data?: T): UserSuccess<T> {
    const message = '사용자 상세 정보를 성공적으로 조회했습니다.';
    return new UserSuccess<T>(message, 200, 'USER_DETAILS_FETCH_SUCCESS', data);
  }

  static userCreationSuccess<T = unknown>(
    userId: string,
    data?: T
  ): UserSuccess<T> {
    const message = `사용자가 성공적으로 생성되었습니다. (사용자 ID: ${userId})`;
    return new UserSuccess<T>(message, 201, 'USER_CREATION_SUCCESS', data);
  }

  static userUpdateSuccess<T = unknown>(
    userId: string,
    data?: T
  ): UserSuccess<T> {
    const message = `사용자 정보가 성공적으로 업데이트되었습니다. (사용자 ID: ${userId})`;
    return new UserSuccess<T>(message, 200, 'USER_UPDATE_SUCCESS', data);
  }

  static userDeletionSuccess(userId: string): UserSuccess<null> {
    const message = `사용자가 성공적으로 삭제되었습니다. (사용자 ID: ${userId})`;
    return new UserSuccess<null>(message, 200, 'USER_DELETION_SUCCESS', null);
  }
}
