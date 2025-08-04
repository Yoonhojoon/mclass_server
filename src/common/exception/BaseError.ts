export abstract class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean | unknown = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational =
      typeof isOperational === 'boolean' ? isOperational : true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = '인증이 필요합니다.') {
    super(message, 401);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = '접근 권한이 없습니다.') {
    super(message, 403);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class InternalServerError extends BaseError {
  constructor(message: string = '서버 내부 오류가 발생했습니다.') {
    super(message, 500);
  }
}
