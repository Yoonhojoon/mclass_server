import { Request, Response, NextFunction } from 'express';
import { TermError } from '../common/exception/term/TermError';
import logger from '../config/logger.config.js';

/**
 * ID 파라미터 검증 미들웨어
 */
export const validateId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;

  // 입력 검증: id가 존재하고 유효한지 확인
  if (!id || id.trim() === '' || id === 'null' || id === 'undefined') {
    logger.warn('잘못된 ID 파라미터로 요청 시도:', {
      id,
      path: req.path,
      method: req.method,
    });

    const termError = TermError.validationError('ID가 유효하지 않습니다.');
    res.status(termError.statusCode).json({
      success: false,
      error: {
        code: termError.errorCode,
        message: termError.message,
      },
    });
    return;
  }

  next();
};

/**
 * UUID 형식 검증 미들웨어 (선택적)
 */
export const validateUuid = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;

  // UUID 형식 검증 (선택적)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    logger.warn('잘못된 UUID 형식으로 요청 시도:', {
      id,
      path: req.path,
      method: req.method,
    });

    const termError = TermError.validationError('올바르지 않은 ID 형식입니다.');
    res.status(termError.statusCode).json({
      success: false,
      error: {
        code: termError.errorCode,
        message: termError.message,
      },
    });
    return;
  }

  next();
};
