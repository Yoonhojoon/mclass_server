import { BaseSuccess } from '../BaseSuccess.js';

export class AuthSuccess extends BaseSuccess {
  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'AUTH_SUCCESS',
    data?: unknown
  ) {
    super(message, statusCode, successCode, data);
  }

  static loginSuccess(
    userId: string,
    role: string,
    data?: unknown
  ): AuthSuccess {
    const message = `로그인이 성공적으로 완료되었습니다. (사용자 ID: ${userId}, 역할: ${role})`;
    return new AuthSuccess(message, 200, 'LOGIN_SUCCESS', data);
  }

  static logoutSuccess(): AuthSuccess {
    const message = '로그아웃이 성공적으로 완료되었습니다.';
    return new AuthSuccess(message, 200, 'LOGOUT_SUCCESS');
  }

  static tokenRefreshSuccess(expiresIn: number, data?: unknown): AuthSuccess {
    const message = `토큰이 성공적으로 갱신되었습니다. (만료 시간: ${expiresIn}초)`;
    return new AuthSuccess(message, 200, 'TOKEN_REFRESH_SUCCESS', data);
  }

  static tokenValidationSuccess(data?: unknown): AuthSuccess {
    const message = '토큰이 유효합니다.';
    return new AuthSuccess(message, 200, 'TOKEN_VALIDATION_SUCCESS', data);
  }

  static passwordChangeSuccess(): AuthSuccess {
    const message =
      '비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요.';
    return new AuthSuccess(message, 200, 'PASSWORD_CHANGE_SUCCESS');
  }

  static passwordResetEmailSent(email: string): AuthSuccess {
    const message = `비밀번호 재설정 이메일이 ${email}로 발송되었습니다.`;
    return new AuthSuccess(message, 200, 'PASSWORD_RESET_EMAIL_SENT');
  }

  static passwordResetSuccess(): AuthSuccess {
    const message = '비밀번호가 성공적으로 재설정되었습니다.';
    return new AuthSuccess(message, 200, 'PASSWORD_RESET_SUCCESS');
  }

  static emailVerificationSent(email: string): AuthSuccess {
    const message = `이메일 인증 링크가 ${email}로 발송되었습니다.`;
    return new AuthSuccess(message, 200, 'EMAIL_VERIFICATION_SENT');
  }

  static emailVerificationSuccess(email: string): AuthSuccess {
    const message = `${email} 이메일 인증이 성공적으로 완료되었습니다.`;
    return new AuthSuccess(message, 200, 'EMAIL_VERIFICATION_SUCCESS');
  }

  static accountActivationSuccess(): AuthSuccess {
    const message = '계정이 성공적으로 활성화되었습니다.';
    return new AuthSuccess(message, 200, 'ACCOUNT_ACTIVATION_SUCCESS');
  }

  static accountDeactivationSuccess(): AuthSuccess {
    const message = '계정이 성공적으로 비활성화되었습니다.';
    return new AuthSuccess(message, 200, 'ACCOUNT_DEACTIVATION_SUCCESS');
  }

  static accountLockSuccess(): AuthSuccess {
    const message = '계정이 성공적으로 잠겨있습니다.';
    return new AuthSuccess(message, 200, 'ACCOUNT_LOCK_SUCCESS');
  }

  static accountUnlockSuccess(): AuthSuccess {
    const message = '계정 잠금이 해제되었습니다.';
    return new AuthSuccess(message, 200, 'ACCOUNT_UNLOCK_SUCCESS');
  }

  static permissionGranted(userId: string, permission: string): AuthSuccess {
    const message = `사용자 ${userId}에게 ${permission} 권한이 성공적으로 부여되었습니다.`;
    return new AuthSuccess(message, 200, 'PERMISSION_GRANTED');
  }

  static permissionRevoked(userId: string, permission: string): AuthSuccess {
    const message = `사용자 ${userId}의 ${permission} 권한이 성공적으로 취소되었습니다.`;
    return new AuthSuccess(message, 200, 'PERMISSION_REVOKED');
  }

  static roleUpdateSuccess(userId: string, newRole: string): AuthSuccess {
    const message = `사용자 ${userId}의 역할이 "${newRole}"로 성공적으로 업데이트되었습니다.`;
    return new AuthSuccess(message, 200, 'ROLE_UPDATE_SUCCESS');
  }

  static sessionCreateSuccess(data?: unknown): AuthSuccess {
    const message = '세션이 성공적으로 생성되었습니다.';
    return new AuthSuccess(message, 200, 'SESSION_CREATE_SUCCESS', data);
  }

  static sessionDestroySuccess(): AuthSuccess {
    const message = '세션이 성공적으로 종료되었습니다.';
    return new AuthSuccess(message, 200, 'SESSION_DESTROY_SUCCESS');
  }

  static sessionExtendSuccess(data?: unknown): AuthSuccess {
    const message = '세션이 성공적으로 연장되었습니다.';
    return new AuthSuccess(message, 200, 'SESSION_EXTEND_SUCCESS', data);
  }

  static securitySettingsUpdateSuccess(): AuthSuccess {
    const message = '보안 설정이 성공적으로 업데이트되었습니다.';
    return new AuthSuccess(message, 200, 'SECURITY_SETTINGS_UPDATE_SUCCESS');
  }

  static twoFactorEnableSuccess(method: string): AuthSuccess {
    const message = `${method} 2단계 인증이 성공적으로 활성화되었습니다.`;
    return new AuthSuccess(message, 200, 'TWO_FACTOR_ENABLE_SUCCESS');
  }

  static twoFactorDisableSuccess(method: string): AuthSuccess {
    const message = `${method} 2단계 인증이 성공적으로 비활성화되었습니다.`;
    return new AuthSuccess(message, 200, 'TWO_FACTOR_DISABLE_SUCCESS');
  }

  static authLogCreateSuccess(): AuthSuccess {
    const message = '인증 로그가 성공적으로 기록되었습니다.';
    return new AuthSuccess(message, 200, 'AUTH_LOG_CREATE_SUCCESS');
  }

  static authLogGetSuccess(count: number, data?: unknown): AuthSuccess {
    const message = `총 ${count}개의 인증 로그를 성공적으로 조회했습니다.`;
    return new AuthSuccess(message, 200, 'AUTH_LOG_GET_SUCCESS', data);
  }
}
