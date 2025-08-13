import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../common/exception/ValidationError.js';
import logger from '../config/logger.config.js';

/**
 * Zod 스키마를 사용하여 요청 바디를 검증하는 미들웨어
 * @param schema 검증할 Zod 스키마
 * @returns Express 미들웨어 함수
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.safeParse(req.body);

      if (!parsed.success) {
        logger.warn('🔍 요청 바디 검증 실패', {
          errors: parsed.error.flatten(),
          body: req.body,
        });

        const validationError = ValidationError.invalidRequest(
          parsed.error.flatten()
        );
        res
          .status(validationError.statusCode)
          .json(validationError.toResponse());
        return;
      }

      // 검증된 데이터로 req.body 교체
      req.body = parsed.data;

      logger.debug('✅ 요청 바디 검증 성공', {
        validatedData: parsed.data,
      });

      next();
    } catch (error) {
      logger.error('❌ 검증 미들웨어 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const validationError = ValidationError.internalServerError(
        '검증 처리 중 오류가 발생했습니다.'
      );
      res.status(validationError.statusCode).json(validationError.toResponse());
    }
  };
};

/**
 * Zod 스키마를 사용하여 쿼리 파라미터를 검증하는 미들웨어
 * @param schema 검증할 Zod 스키마
 * @returns Express 미들웨어 함수
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.safeParse(req.query);

      if (!parsed.success) {
        logger.warn('🔍 쿼리 파라미터 검증 실패', {
          errors: parsed.error.flatten(),
          query: req.query,
        });

        const validationError = ValidationError.invalidRequest(
          parsed.error.flatten()
        );
        res
          .status(validationError.statusCode)
          .json(validationError.toResponse());
        return;
      }

      // 검증된 데이터로 req.query 교체
      req.query = parsed.data as any;

      logger.debug('✅ 쿼리 파라미터 검증 성공', {
        validatedData: parsed.data,
      });

      next();
    } catch (error) {
      logger.error('❌ 검증 미들웨어 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const validationError = ValidationError.internalServerError(
        '검증 처리 중 오류가 발생했습니다.'
      );
      res.status(validationError.statusCode).json(validationError.toResponse());
    }
  };
};

/**
 * Zod 스키마를 사용하여 URL 파라미터를 검증하는 미들웨어
 * @param schema 검증할 Zod 스키마
 * @returns Express 미들웨어 함수
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.safeParse(req.params);

      if (!parsed.success) {
        logger.warn('🔍 URL 파라미터 검증 실패', {
          errors: parsed.error.flatten(),
          params: req.params,
        });

        const validationError = ValidationError.invalidRequest(
          parsed.error.flatten()
        );
        res
          .status(validationError.statusCode)
          .json(validationError.toResponse());
        return;
      }

      // 검증된 데이터로 req.params 교체
      req.params = parsed.data as any;

      logger.debug('✅ URL 파라미터 검증 성공', {
        validatedData: parsed.data,
      });

      next();
    } catch (error) {
      logger.error('❌ 검증 미들웨어 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const validationError = ValidationError.internalServerError(
        '검증 처리 중 오류가 발생했습니다.'
      );
      res.status(validationError.statusCode).json(validationError.toResponse());
    }
  };
};
