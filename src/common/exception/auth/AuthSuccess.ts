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

  static passwordResetEmailSent(email: string): SuccessResponse<null> {
    const message = `비밀번호 재설정 이메일이 ${email}로 발송되었습니다.`;
    return {
      success: true,
      data: null,
      message,
      code: 'PASSWORD_RESET_EMAIL_SENT',
    };
  }

  static passwordResetSuccess(): SuccessResponse<null> {
    const message = '비밀번호가 성공적으로 재설정되었습니다.';
    return {
      success: true,
      data: null,
      message,
      code: 'PASSWORD_RESET_SUCCESS',
    };
  }

  static emailVerificationSent(email: string): SuccessResponse<null> {
    const message = `이메일 인증 링크가 ${email}로 발송되었습니다.`;
    return {
      success: true,
      data: null,
      message,
      code: 'EMAIL_VERIFICATION_SENT',
    };
  }

  static emailVerificationSuccess(email: string): SuccessResponse<null> {
    const message = `${email} 이메일 인증이 성공적으로 완료되었습니다.`;
    return {
      success: true,
      data: null,
      message,
      code: 'EMAIL_VERIFICATION_SUCCESS',
    };
  }

  static accountActivationSuccess(): SuccessResponse<null> {
    const message = '계정이 성공적으로 활성화되었습니다.';
    return {
      success: true,
      data: null,
      message,
      code: 'ACCOUNT_ACTIVATION_SUCCESS',
    };
  }

  static accountDeactivationSuccess(): SuccessResponse<null> {
    const message = '계정이 성공적으로 비활성화되었습니다.';
    return {
      success: true,
      data: null,
      message,
      code: 'ACCOUNT_DEACTIVATION_SUCCESS',
    };
  }

  static accountLockSuccess(): SuccessResponse<null> {
    const message = '계정이 성공적으로 잠겨있습니다.';
    return {
      success: true,
      data: null,
      message,
      code: 'ACCOUNT_LOCK_SUCCESS',
    };
  }

  static accountUnlockSuccess(): SuccessResponse<null> {
    const message = '계정 잠금이 해제되었습니다.';
    return {
      success: true,
      data: null,
      message,
      code: 'ACCOUNT_UNLOCK_SUCCESS',
    };
  }

  static permissionGranted(
    userId: string,
    permission: string
  ): SuccessResponse<null> {
    const message = `사용자 ${userId}에게 ${permission} 권한이 성공적으로 부여되었습니다.`;
    return {
      success: true,
      data: null,
      message,
      code: 'PERMISSION_GRANTED',
    };
  }

  static permissionRevoked(
    userId: string,
    permission: string
  ): SuccessResponse<null> {
    const message = `사용자 ${userId}의 ${permission} 권한이 성공적으로 취소되었습니다.`;
    return {
      success: true,
      data: null,
      message,
      code: 'PERMISSION_REVOKED',
    };
  }

  static roleUpdateSuccess(
    userId: string,
    newRole: string
  ): SuccessResponse<null> {
    const message = `사용자 ${userId}의 역할이 "${newRole}"로 성공적으로 업데이트되었습니다.`;
    return {
      success: true,
      data: null,
      message,
      code: 'ROLE_UPDATE_SUCCESS',
    };
  }

  static sessionCreateSuccess<T = unknown>(data?: T): SuccessResponse<T> {
    const message = '세션이 성공적으로 생성되었습니다.';
    return {
      success: true,
      data: data as T,
      message,
      code: 'SESSION_CREATE_SUCCESS',
    };
  }

  static sessionDestroySuccess(): SuccessResponse<null> {
    const message = '세션이 성공적으로 종료되었습니다.';
    return {
      success: true,
      data: null,
      message,
      code: 'SESSION_DESTROY_SUCCESS',
    };
  }

  static sessionExtendSuccess<T = unknown>(data?: T): SuccessResponse<T> {
    const message = '세션이 성공적으로 연장되었습니다.';
    return {
      success: true,
      data: data as T,
      message,
      code: 'SESSION_EXTEND_SUCCESS',
    };
  }

  static securitySettingsUpdateSuccess(): SuccessResponse<null> {
    const message = '보안 설정이 성공적으로 업데이트되었습니다.';
    return {
      success: true,
      data: null,
      message,
      code: 'SECURITY_SETTINGS_UPDATE_SUCCESS',
    };
  }

  static twoFactorEnableSuccess(method: string): SuccessResponse<null> {
    const message = `${method} 2단계 인증이 성공적으로 활성화되었습니다.`;
    return {
      success: true,
      data: null,
      message,
      code: 'TWO_FACTOR_ENABLE_SUCCESS',
    };
  }

  static twoFactorDisableSuccess(method: string): SuccessResponse<null> {
    const message = `${method} 2단계 인증이 성공적으로 비활성화되었습니다.`;
    return {
      success: true,
      data: null,
      message,
      code: 'TWO_FACTOR_DISABLE_SUCCESS',
    };
  }

  static authLogCreateSuccess(): SuccessResponse<null> {
    const message = '인증 로그가 성공적으로 기록되었습니다.';
    return {
      success: true,
      data: null,
      message,
      code: 'AUTH_LOG_CREATE_SUCCESS',
    };
  }

  static authLogGetSuccess<T = unknown>(
    count: number,
    data?: T
  ): SuccessResponse<T> {
    const message = `총 ${count}개의 인증 로그를 성공적으로 조회했습니다.`;
    return {
      success: true,
      data: data as T,
      message,
      code: 'AUTH_LOG_GET_SUCCESS',
    };
  }
}
