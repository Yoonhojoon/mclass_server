import { Request, Response, NextFunction } from 'express';
import { BaseError } from './BaseError.js';

export interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
}

export class ErrorHandler {
  public static handle(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    let statusCode = 500;
    let message = '서버 내부 오류가 발생했습니다.';

    if (error instanceof BaseError) {
      statusCode = error.statusCode;
      message = error.message;
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      message = error.message;
    } else if (error.name === 'CastError') {
      statusCode = 400;
      message = '잘못된 데이터 형식입니다.';
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      statusCode = 400;
      message = '데이터베이스 오류가 발생했습니다.';
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    };

    // 개발 환경에서는 스택 트레이스도 포함
    if (process.env.NODE_ENV === 'development') {
      (errorResponse as any).stack = error.stack;
    }

    res.status(statusCode).json(errorResponse);
  }

  public static notFound(req: Request, res: Response, next: NextFunction): void {
    const error = new Error(`경로를 찾을 수 없습니다: ${req.originalUrl}`);
    (error as any).statusCode = 404;
    next(error);
  }

  public static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
} 