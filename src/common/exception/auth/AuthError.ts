import { BaseError } from '../BaseError.js';
import { TokenError } from '../token/TokenError.js';
import { ErrorResponse } from '../../types/api.js';

// TokenError를 재export하여 AuthError에서도 사용할 수 있도록 함
export { TokenError };

export class AuthError extends BaseError {
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 401,
    errorCode: string = 'AUTH_ERROR',
    details?: unknown
  ) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'AuthError';
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

  static invalidCredentials(): AuthError {
    return new AuthError(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  static authenticationFailed(
    message: string = '인증에 실패했습니다.'
  ): AuthError {
    return new AuthError(message, 401, 'AUTHENTICATION_FAILED');
  }

  static permissionDenied(resource: string, action: string): AuthError {
    return new AuthError(
      `${resource}에 대한 ${action} 권한이 없습니다.`,
      403,
      'PERMISSION_DENIED'
    );
  }

  static roleInsufficient(requiredRole: string, userRole: string): AuthError {
    return new AuthError(
      `필요한 권한: ${requiredRole}, 현재 권한: ${userRole}`,
      403,
      'ROLE_INSUFFICIENT'
    );
  }

  static sessionExpired(): AuthError {
    return new AuthError('세션이 만료되었습니다.', 401, 'SESSION_EXPIRED');
  }

  static accountLocked(): AuthError {
    return new AuthError('계정이 잠겨있습니다.', 403, 'ACCOUNT_LOCKED');
  }

  static tooManyLoginAttempts(): AuthError {
    return new AuthError(
      '로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
      429,
      'TOO_MANY_LOGIN_ATTEMPTS'
    );
  }

  static validationError(message: string): AuthError {
    return new AuthError(
      `인증 데이터 검증 오류: ${message}`,
      400,
      'AUTH_VALIDATION_ERROR'
    );
  }

  static passwordResetTokenExpired(): AuthError {
    return new AuthError(
      '비밀번호 재설정 토큰이 만료되었습니다.',
      401,
      'PASSWORD_RESET_TOKEN_EXPIRED'
    );
  }

  static emailVerificationTokenExpired(): AuthError {
    return new AuthError(
      '이메일 인증 토큰이 만료되었습니다.',
      401,
      'EMAIL_VERIFICATION_TOKEN_EXPIRED'
    );
  }

  // TokenError를 사용하는 편의 메서드들
  static tokenExpired(message: string = '토큰이 만료되었습니다.'): TokenError {
    return TokenError.expiredToken(message);
  }

  static invalidToken(
    message: string = '유효하지 않은 토큰입니다.'
  ): TokenError {
    return TokenError.invalidToken(message);
  }

  static missingToken(message: string = '인증 토큰이 필요합니다.'): TokenError {
    return TokenError.missingToken(message);
  }

  static refreshTokenError(
    message: string = '리프레시 토큰이 유효하지 않습니다.'
  ): TokenError {
    return TokenError.invalidToken(message);
  }

  static tokenVerificationFailed(
    message: string = '토큰 검증에 실패했습니다.'
  ): TokenError {
    return TokenError.tokenVerificationFailed(message);
  }

  static loginFailed(message: string = '로그인에 실패했습니다.'): AuthError {
    return new AuthError(message, 401, 'LOGIN_FAILED');
  }

  static logoutFailed(message: string = '로그아웃에 실패했습니다.'): AuthError {
    return new AuthError(message, 500, 'LOGOUT_FAILED');
  }

  static registrationFailed(
    message: string = '회원가입에 실패했습니다.'
  ): AuthError {
    return new AuthError(message, 500, 'REGISTRATION_FAILED');
  }

  static passwordChangeFailed(
    message: string = '비밀번호 변경에 실패했습니다.'
  ): AuthError {
    return new AuthError(message, 500, 'PASSWORD_CHANGE_FAILED');
  }

  static tokenRefreshFailed(
    message: string = '토큰 갱신에 실패했습니다.'
  ): AuthError {
    return new AuthError(message, 500, 'TOKEN_REFRESH_FAILED');
  }

  static invalidRequest(message: string = '잘못된 요청입니다.'): AuthError {
    return new AuthError(message, 400, 'INVALID_REQUEST');
  }

  static socialLoginFailed(
    provider: string,
    message: string = '소셜 로그인에 실패했습니다.'
  ): AuthError {
    return new AuthError(
      `${provider} 로그인: ${message}`,
      500,
      'SOCIAL_LOGIN_FAILED'
    );
  }

  static socialProviderNotSupported(provider: string): AuthError {
    return new AuthError(
      `지원하지 않는 소셜 로그인 제공자입니다: ${provider}`,
      400,
      'SOCIAL_PROVIDER_NOT_SUPPORTED'
    );
  }

  static socialAccountNotLinked(provider: string): AuthError {
    return new AuthError(
      `${provider} 계정이 연결되지 않았습니다.`,
      401,
      'SOCIAL_ACCOUNT_NOT_LINKED'
    );
  }

  static emailNotProvidedBySocial(provider: string): AuthError {
    return new AuthError(
      `${provider}에서 이메일 정보를 제공하지 않았습니다.`,
      400,
      'EMAIL_NOT_PROVIDED_BY_SOCIAL'
    );
  }
}
