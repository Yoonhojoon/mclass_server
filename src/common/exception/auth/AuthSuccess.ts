import { BaseSuccess } from '../BaseSuccess.js';

export class AuthSuccess<T = unknown> extends BaseSuccess<T> {
  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'AUTH_SUCCESS',
    data?: T,
    meta?: Record<string, unknown>
  ) {
    super(message, statusCode, successCode, data, meta);
  }

  static loginSuccess<T = unknown>(
    userId: string,
    role: string,
    data?: T
  ): AuthSuccess<T> {
    const message = `로그인이 성공적으로 완료되었습니다. (사용자 ID: ${userId}, 역할: ${role})`;
    return new AuthSuccess<T>(message, 200, 'LOGIN_SUCCESS', data);
  }

  static logoutSuccess(): AuthSuccess<null> {
    return new AuthSuccess<null>(
      '로그아웃이 성공적으로 완료되었습니다.',
      200,
      'LOGOUT_SUCCESS',
      null
    );
  }

  static tokenRefreshSuccess<T = unknown>(
    expiresIn: number,
    data?: T
  ): AuthSuccess<T> {
    const message = `토큰이 성공적으로 갱신되었습니다. (만료 시간: ${expiresIn}초)`;
    return new AuthSuccess<T>(message, 200, 'TOKEN_REFRESH_SUCCESS', data);
  }

  static tokenValidationSuccess<T = unknown>(data?: T): AuthSuccess<T> {
    return new AuthSuccess<T>(
      '토큰이 유효합니다.',
      200,
      'TOKEN_VALIDATION_SUCCESS',
      data
    );
  }

  static passwordChangeSuccess(): AuthSuccess<null> {
    return new AuthSuccess<null>(
      '비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요.',
      200,
      'PASSWORD_CHANGE_SUCCESS',
      null
    );
  }

  static passwordResetEmailSent(email: string): AuthSuccess<null> {
    return new AuthSuccess<null>(
      `비밀번호 재설정 이메일이 ${email}로 발송되었습니다.`,
      200,
      'PASSWORD_RESET_EMAIL_SENT',
      null
    );
  }

  static passwordResetSuccess(): AuthSuccess<null> {
    return new AuthSuccess<null>(
      '비밀번호가 성공적으로 재설정되었습니다.',
      200,
      'PASSWORD_RESET_SUCCESS',
      null
    );
  }

  static emailVerificationSent(email: string): AuthSuccess<null> {
    return new AuthSuccess<null>(
      `이메일 인증 링크가 ${email}로 발송되었습니다.`,
      200,
      'EMAIL_VERIFICATION_SENT',
      null
    );
  }

  static emailVerificationSuccess(email: string): AuthSuccess<null> {
    return new AuthSuccess<null>(
      `${email} 이메일 인증이 성공적으로 완료되었습니다.`,
      200,
      'EMAIL_VERIFICATION_SUCCESS',
      null
    );
  }

  static accountActivationSuccess(): AuthSuccess<null> {
    return new AuthSuccess<null>(
      '계정이 성공적으로 활성화되었습니다.',
      200,
      'ACCOUNT_ACTIVATION_SUCCESS',
      null
    );
  }

  static accountDeactivationSuccess(): AuthSuccess<null> {
    return new AuthSuccess<null>(
      '계정이 성공적으로 비활성화되었습니다.',
      200,
      'ACCOUNT_DEACTIVATION_SUCCESS',
      null
    );
  }

  static accountLockSuccess(): AuthSuccess<null> {
    return new AuthSuccess<null>(
      '계정이 성공적으로 잠금 처리되었습니다.',
      200,
      'ACCOUNT_LOCK_SUCCESS',
      null
    );
  }

  static accountUnlockSuccess(): AuthSuccess<null> {
    return new AuthSuccess<null>(
      '계정 잠금이 성공적으로 해제되었습니다.',
      200,
      'ACCOUNT_UNLOCK_SUCCESS',
      null
    );
  }

  static permissionGranted(
    userId: string,
    permission: string
  ): AuthSuccess<null> {
    return new AuthSuccess<null>(
      `사용자 ${userId}에게 권한 '${permission}'이 성공적으로 부여되었습니다.`,
      200,
      'PERMISSION_GRANTED_SUCCESS',
      null
    );
  }

  static permissionRevoked(
    userId: string,
    permission: string
  ): AuthSuccess<null> {
    return new AuthSuccess<null>(
      `사용자 ${userId}의 권한 '${permission}'이 성공적으로 철회되었습니다.`,
      200,
      'PERMISSION_REVOKED_SUCCESS',
      null
    );
  }

  static roleUpdateSuccess(userId: string, newRole: string): AuthSuccess<null> {
    return new AuthSuccess<null>(
      `사용자 ${userId}의 역할이 성공적으로 '${newRole}'로 변경되었습니다.`,
      200,
      'ROLE_UPDATE_SUCCESS',
      null
    );
  }

  static sessionCreateSuccess<T = unknown>(data?: T): AuthSuccess<T> {
    return new AuthSuccess<T>(
      '세션이 성공적으로 생성되었습니다.',
      201,
      'SESSION_CREATE_SUCCESS',
      data
    );
  }

  static sessionDestroySuccess(): AuthSuccess<null> {
    return new AuthSuccess<null>(
      '세션이 성공적으로 종료되었습니다.',
      200,
      'SESSION_DESTROY_SUCCESS',
      null
    );
  }

  static sessionExtendSuccess<T = unknown>(data?: T): AuthSuccess<T> {
    return new AuthSuccess<T>(
      '세션이 성공적으로 연장되었습니다.',
      200,
      'SESSION_EXTEND_SUCCESS',
      data
    );
  }

  static securitySettingsUpdateSuccess(): AuthSuccess<null> {
    return new AuthSuccess<null>(
      '보안 설정이 성공적으로 업데이트되었습니다.',
      200,
      'SECURITY_SETTINGS_UPDATE_SUCCESS',
      null
    );
  }

  static twoFactorEnableSuccess(method: string): AuthSuccess<null> {
    return new AuthSuccess<null>(
      `${method} 2단계 인증이 성공적으로 활성화되었습니다.`,
      200,
      'TWO_FACTOR_ENABLE_SUCCESS',
      null
    );
  }

  static twoFactorDisableSuccess(method: string): AuthSuccess<null> {
    return new AuthSuccess<null>(
      `${method} 2단계 인증이 성공적으로 비활성화되었습니다.`,
      200,
      'TWO_FACTOR_DISABLE_SUCCESS',
      null
    );
  }

  static authLogCreateSuccess(): AuthSuccess<null> {
    return new AuthSuccess<null>(
      '인증 로그가 성공적으로 생성되었습니다.',
      201,
      'AUTH_LOG_CREATE_SUCCESS',
      null
    );
  }

  static authLogGetSuccess<T = unknown>(
    count: number,
    data?: T
  ): AuthSuccess<T> {
    return new AuthSuccess<T>(
      `인증 로그 ${count}개가 성공적으로 조회되었습니다.`,
      200,
      'AUTH_LOG_GET_SUCCESS',
      data,
      { count }
    );
  }
}
