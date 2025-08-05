// 기본 응답 타입 (공통 필드)
export interface BaseResponse {
  success: boolean;
}

// 성공 응답
export interface SuccessResponse<T = any> extends BaseResponse {
  success: true;
  data: T;
  message?: string;
}

// 에러 응답
export interface ErrorResponse<T = unknown> extends BaseResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: T;
  };
}

// 유니온 타입 (성공 또는 에러)
export type ApiResponse<T = any, E = unknown> =
  | SuccessResponse<T>
  | ErrorResponse<E>;
