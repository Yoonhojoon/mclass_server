import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../common/exception/BaseError';
import { TermError } from '../common/exception/term/TermError';
import logger from '../config/logger.config.js';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('에러 발생:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
  });

  // TermError 처리
  if (error instanceof TermError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.errorCode,
        message: error.message,
        details: error.details,
      },
    };

    res.status(error.statusCode).json(response);
    return;
  }

  // BaseError 처리
  if (error instanceof BaseError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'CUSTOM_ERROR',
        message: error.message,
      },
    };

    res.status(error.statusCode).json(response);
    return;
  }

  // 기본 서버 에러
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다.',
    },
  };

  res.status(500).json(response);
};
