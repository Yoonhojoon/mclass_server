import { SuccessResponse } from '../types/api.js';

/**
 * 성공 응답 생성 유틸리티
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}
