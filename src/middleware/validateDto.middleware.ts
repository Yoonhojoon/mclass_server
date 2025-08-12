import { Request, Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationError as CustomValidationError } from '../common/exception/ValidationError.js';

import logger from '../config/logger.config.js';

/**
 * class-validator를 사용하여 요청 바디를 DTO로 변환하고 검증하는 미들웨어
 * @param dtoClass 검증할 DTO 클래스
 * @returns Express 미들웨어 함수
 */
export const validateDto = (
  dtoClass: any
): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // plain object를 DTO 클래스 인스턴스로 변환
      const dtoInstance = plainToClass(dtoClass, req.body);

      // DTO 검증
      const errors = await validate(dtoInstance);

      if (errors.length > 0) {
        logger.warn('🔍 DTO 검증 실패', {
          errors: errors.map(error => ({
            property: error.property,
            constraints: error.constraints,
            value: error.value,
          })),
          body: req.body,
        });

        // 검증 오류를 플랫한 형태로 변환
        const validationErrors: Record<string, string[]> = {};
        errors.forEach(error => {
          if (error.constraints) {
            validationErrors[error.property] = Object.values(error.constraints);
          }
        });

        const validationError =
          CustomValidationError.invalidRequest(validationErrors);
        res
          .status(validationError.statusCode)
          .json(validationError.toResponse());
        return;
      }

      // 검증된 DTO 인스턴스로 req.body 교체
      req.body = dtoInstance;

      logger.debug('✅ DTO 검증 성공', {
        validatedData: dtoInstance,
      });

      next();
    } catch (error) {
      logger.error('❌ DTO 검증 미들웨어 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const validationError = CustomValidationError.internalServerError(
        'DTO 검증 처리 중 오류가 발생했습니다.'
      );
      res.status(validationError.statusCode).json(validationError.toResponse());
    }
  };
};

/**
 * class-transformer를 사용하여 응답 데이터를 DTO로 변환하는 헬퍼 함수
 * @param data 변환할 데이터
 * @param dtoClass 변환할 DTO 클래스
 * @returns 변환된 DTO 인스턴스
 */
export const transformToDto = (data: any, dtoClass: any): any => {
  return plainToClass(dtoClass, data, { excludeExtraneousValues: true });
};

/**
 * 배열 데이터를 DTO 배열로 변환하는 헬퍼 함수
 * @param dataArray 변환할 데이터 배열
 * @param dtoClass 변환할 DTO 클래스
 * @returns 변환된 DTO 인스턴스 배열
 */
export const transformArrayToDto = (dataArray: any[], dtoClass: any): any[] => {
  return dataArray.map(item =>
    plainToClass(dtoClass, item, { excludeExtraneousValues: true })
  );
};
