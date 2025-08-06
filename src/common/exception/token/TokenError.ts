import { BaseError } from '../BaseError.js';
import { ErrorResponse } from '../../types/api.js';

export class TokenError extends BaseError {
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 401,
    errorCode: string = 'TOKEN_ERROR',
    details?: unknown
  ) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'TokenError';
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

  static invalidToken(
    message: string = '유효하지 않은 토큰입니다'
  ): TokenError {
    return new TokenError(message, 401, 'INVALID_TOKEN');
  }

  static expiredToken(message: string = '토큰이 만료되었습니다'): TokenError {
    return new TokenError(message, 401, 'EXPIRED_TOKEN');
  }

  static malformedToken(
    message: string = '토큰 형식이 올바르지 않습니다'
  ): TokenError {
    return new TokenError(message, 401, 'MALFORMED_TOKEN');
  }

  static missingToken(
    message: string = '토큰이 제공되지 않았습니다'
  ): TokenError {
    return new TokenError(message, 401, 'MISSING_TOKEN');
  }

  static tokenGenerationFailed(
    message: string = '토큰 생성에 실패했습니다'
  ): TokenError {
    return new TokenError(message, 500, 'TOKEN_GENERATION_FAILED');
  }

  static tokenVerificationFailed(
    message: string = '토큰 검증에 실패했습니다'
  ): TokenError {
    return new TokenError(message, 401, 'TOKEN_VERIFICATION_FAILED');
  }
}
