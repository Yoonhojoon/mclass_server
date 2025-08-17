import { Request, Response, NextFunction } from 'express';
import {
  BaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
} from './BaseError.js';
import logger from '../../config/logger.config.js';

export interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  error?: string;
  details?: unknown;
  stack?: string;
}

interface ExtendedError extends Error {
  statusCode?: number;
  code?: string;
}

export class ErrorHandler {
  public static handle(
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    let statusCode = 500;
    let message = '서버 내부 오류가 발생했습니다.';
    let errorType = 'InternalServerError';

    if (error instanceof BaseError) {
      statusCode = error.statusCode;
      message = error.message;

      // BaseError의 타입에 따라 errorType 설정
      switch (statusCode) {
        case 400:
          errorType = 'BadRequest';
          break;
        case 401:
          errorType = 'Unauthorized';
          break;
        case 403:
          errorType = 'Forbidden';
          break;
        case 404:
          errorType = 'NotFound';
          break;
        case 409:
          errorType = 'Conflict';
          break;
        case 422:
          errorType = 'ValidationError';
          break;
        default:
          errorType = 'InternalServerError';
      }
    } else if (error.name === 'ValidationError' || error.name === 'ZodError') {
      statusCode = 400;
      message = '요청 데이터 검증에 실패했습니다.';
      errorType = 'BadRequest';
    } else if (error.name === 'CastError') {
      statusCode = 400;
      message = '잘못된 데이터 형식입니다.';
      errorType = 'BadRequest';
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      statusCode = 400;
      message = '데이터베이스 오류가 발생했습니다.';
      errorType = 'BadRequest';
    } else if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;
      if (prismaError.code === 'P2002') {
        statusCode = 409;
        message = '중복된 데이터가 존재합니다.';
        errorType = 'Conflict';
      } else if (prismaError.code === 'P2025') {
        statusCode = 404;
        message = '요청한 데이터를 찾을 수 없습니다.';
        errorType = 'NotFound';
      } else {
        statusCode = 400;
        message = '데이터베이스 오류가 발생했습니다.';
        errorType = 'BadRequest';
      }
    } else if (error.name === 'PrismaClientValidationError') {
      statusCode = 400;
      message = '데이터 검증에 실패했습니다.';
      errorType = 'BadRequest';
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = '유효하지 않은 토큰입니다.';
      errorType = 'Unauthorized';
    } else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = '토큰이 만료되었습니다.';
      errorType = 'Unauthorized';
    } else if (
      error.message.includes('Redis') ||
      error.message.includes('redis')
    ) {
      if (error.message.includes('ECONNREFUSED')) {
        statusCode = 503;
        message = 'Redis 서버에 연결할 수 없습니다.';
        errorType = 'ServiceUnavailable';
      } else if (
        error.message.includes('REDIS_URL') ||
        error.message.includes('redis config')
      ) {
        statusCode = 500;
        message = 'Redis 설정 오류가 발생했습니다.';
        errorType = 'InternalServerError';
      } else {
        statusCode = 503;
        message = '캐시 서비스에 일시적인 문제가 발생했습니다.';
        errorType = 'ServiceUnavailable';
      }
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      error: errorType,
    };

    // 개발 환경에서만 스택 트레이스와 상세 정보 포함
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
      errorResponse.details = {
        name: error.name,
        message: error.message,
        ...((error as any).code && { code: (error as any).code }),
      };
    }

    // 에러 로깅
    logger.error(`${errorType} Error: ${message}`, {
      statusCode,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      stack: error.stack,
    });

    res.status(statusCode).json(errorResponse);
  }

  public static notFound(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const error = new Error(
      `경로를 찾을 수 없습니다: ${req.originalUrl}`
    ) as ExtendedError;
    error.statusCode = 404;
    next(error);
  }

  public static asyncHandler(
    fn: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<unknown> | unknown
  ) {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // 특정 에러 타입별 핸들러 메서드들
  public static badRequest(
    message: string = '잘못된 요청입니다.'
  ): ValidationError {
    return new ValidationError(message);
  }

  public static unauthorized(
    message: string = '인증이 필요합니다.'
  ): UnauthorizedError {
    return new UnauthorizedError(message);
  }

  public static forbidden(
    message: string = '접근 권한이 없습니다.'
  ): ForbiddenError {
    return new ForbiddenError(message);
  }

  public static notFoundError(
    message: string = '요청한 리소스를 찾을 수 없습니다.'
  ): NotFoundError {
    return new NotFoundError(message);
  }

  public static conflict(
    message: string = '리소스 충돌이 발생했습니다.'
  ): ConflictError {
    return new ConflictError(message);
  }

  public static validationError(
    message: string = '데이터 검증에 실패했습니다.'
  ): ValidationError {
    return new ValidationError(message);
  }

  public static internalServerError(
    message: string = '서버 내부 오류가 발생했습니다.'
  ): InternalServerError {
    return new InternalServerError(message);
  }
}
