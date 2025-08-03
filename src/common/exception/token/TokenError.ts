import { BaseError } from '../BaseError.js';

export class TokenError extends BaseError {
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 401,
    errorCode: string = 'TOKEN_ERROR',
    details?: any
  ) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'TokenError';
  }

  static invalidToken(message: string = '유효하지 않은 토큰입니다') {
    return new TokenError(message, 401, 'INVALID_TOKEN');
  }

  static expiredToken(message: string = '토큰이 만료되었습니다') {
    return new TokenError(message, 401, 'EXPIRED_TOKEN');
  }

  static malformedToken(message: string = '토큰 형식이 올바르지 않습니다') {
    return new TokenError(message, 401, 'MALFORMED_TOKEN');
  }

  static missingToken(message: string = '토큰이 제공되지 않았습니다') {
    return new TokenError(message, 401, 'MISSING_TOKEN');
  }

  static tokenGenerationFailed(message: string = '토큰 생성에 실패했습니다') {
    return new TokenError(message, 500, 'TOKEN_GENERATION_FAILED');
  }

  static tokenVerificationFailed(message: string = '토큰 검증에 실패했습니다') {
    return new TokenError(message, 401, 'TOKEN_VERIFICATION_FAILED');
  }
} 