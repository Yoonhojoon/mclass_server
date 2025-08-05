import { SuccessResponse } from '../../types/api.js';

export class AuthSuccessResponse {
  static loginSuccess<T = any>(
    userId: string,
    role: string,
    data?: T
  ): SuccessResponse<T> {
    const message = `로그인이 성공적으로 완료되었습니다. (사용자 ID: ${userId}, 역할: ${role})`;
    return {
      success: true,
      data: data as T,
      message,
    };
  }

  static logoutSuccess(): SuccessResponse<null> {
    const message = '로그아웃이 성공적으로 완료되었습니다.';
    return {
      success: true,
      data: null,
      message,
    };
  }

  static tokenRefreshSuccess<T = any>(
    expiresIn: number,
    data?: T
  ): SuccessResponse<T> {
    const message = `토큰이 성공적으로 갱신되었습니다. (만료 시간: ${expiresIn}초)`;
    return {
      success: true,
      data: data as T,
      message,
    };
  }

  static tokenValidationSuccess<T = any>(data?: T): SuccessResponse<T> {
    const message = '토큰이 유효합니다.';
    return {
      success: true,
      data: data as T,
      message,
    };
  }

  static passwordChangeSuccess(): SuccessResponse<null> {
    const message =
      '비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요.';
    return {
      success: true,
      data: null,
      message,
    };
  }

  static passwordResetEmailSent(email: string): AuthSuccessResponse {
    const message = `비밀번호 재설정 이메일이 ${email}로 발송되었습니다.`;
    return {
      success: true,
      code: 'PASSWORD_RESET_EMAIL_SENT',
      message,
    };
  }

  static passwordResetSuccess(): AuthSuccessResponse {
    const message = '비밀번호가 성공적으로 재설정되었습니다.';
    return {
      success: true,
      code: 'PASSWORD_RESET_SUCCESS',
      message,
    };
  }

  static emailVerificationSent(email: string): AuthSuccessResponse {
    const message = `이메일 인증 링크가 ${email}로 발송되었습니다.`;
    return {
      success: true,
      code: 'EMAIL_VERIFICATION_SENT',
      message,
    };
  }

  static emailVerificationSuccess(email: string): AuthSuccessResponse {
    const message = `${email} 이메일 인증이 성공적으로 완료되었습니다.`;
    return {
      success: true,
      code: 'EMAIL_VERIFICATION_SUCCESS',
      message,
    };
  }

  static accountActivationSuccess(): AuthSuccessResponse {
    const message = '계정이 성공적으로 활성화되었습니다.';
    return {
      success: true,
      code: 'ACCOUNT_ACTIVATION_SUCCESS',
      message,
    };
  }

  static accountDeactivationSuccess(): AuthSuccessResponse {
    const message = '계정이 성공적으로 비활성화되었습니다.';
    return {
      success: true,
      code: 'ACCOUNT_DEACTIVATION_SUCCESS',
      message,
    };
  }

  static accountLockSuccess(): AuthSuccessResponse {
    const message = '계정이 성공적으로 잠겨있습니다.';
    return {
      success: true,
      code: 'ACCOUNT_LOCK_SUCCESS',
      message,
    };
  }

  static accountUnlockSuccess(): AuthSuccessResponse {
    const message = '계정 잠금이 해제되었습니다.';
    return {
      success: true,
      code: 'ACCOUNT_UNLOCK_SUCCESS',
      message,
    };
  }

  static permissionGranted(
    userId: string,
    permission: string
  ): AuthSuccessResponse {
    const message = `사용자 ${userId}에게 ${permission} 권한이 성공적으로 부여되었습니다.`;
    return {
      success: true,
      code: 'PERMISSION_GRANTED',
      message,
    };
  }

  static permissionRevoked(
    userId: string,
    permission: string
  ): AuthSuccessResponse {
    const message = `사용자 ${userId}의 ${permission} 권한이 성공적으로 취소되었습니다.`;
    return {
      success: true,
      code: 'PERMISSION_REVOKED',
      message,
    };
  }

  static roleUpdateSuccess(
    userId: string,
    newRole: string
  ): AuthSuccessResponse {
    const message = `사용자 ${userId}의 역할이 "${newRole}"로 성공적으로 업데이트되었습니다.`;
    return {
      success: true,
      code: 'ROLE_UPDATE_SUCCESS',
      message,
    };
  }

  static sessionCreateSuccess(data?: unknown): AuthSuccessResponse {
    const message = '세션이 성공적으로 생성되었습니다.';
    return {
      success: true,
      code: 'SESSION_CREATE_SUCCESS',
      message,
      data,
    };
  }

  static sessionDestroySuccess(): AuthSuccessResponse {
    const message = '세션이 성공적으로 종료되었습니다.';
    return {
      success: true,
      code: 'SESSION_DESTROY_SUCCESS',
      message,
    };
  }

  static sessionExtendSuccess(data?: unknown): AuthSuccessResponse {
    const message = '세션이 성공적으로 연장되었습니다.';
    return {
      success: true,
      code: 'SESSION_EXTEND_SUCCESS',
      message,
      data,
    };
  }

  static securitySettingsUpdateSuccess(): AuthSuccessResponse {
    const message = '보안 설정이 성공적으로 업데이트되었습니다.';
    return {
      success: true,
      code: 'SECURITY_SETTINGS_UPDATE_SUCCESS',
      message,
    };
  }

  static twoFactorEnableSuccess(method: string): AuthSuccessResponse {
    const message = `${method} 2단계 인증이 성공적으로 활성화되었습니다.`;
    return {
      success: true,
      code: 'TWO_FACTOR_ENABLE_SUCCESS',
      message,
    };
  }

  static twoFactorDisableSuccess(method: string): AuthSuccessResponse {
    const message = `${method} 2단계 인증이 성공적으로 비활성화되었습니다.`;
    return {
      success: true,
      code: 'TWO_FACTOR_DISABLE_SUCCESS',
      message,
    };
  }

  static authLogCreateSuccess(): AuthSuccessResponse {
    const message = '인증 로그가 성공적으로 기록되었습니다.';
    return {
      success: true,
      code: 'AUTH_LOG_CREATE_SUCCESS',
      message,
    };
  }

  static authLogGetSuccess(count: number, data?: unknown): AuthSuccessResponse {
    const message = `총 ${count}개의 인증 로그를 성공적으로 조회했습니다.`;
    return {
      success: true,
      code: 'AUTH_LOG_GET_SUCCESS',
      message,
      data,
    };
  }
}
