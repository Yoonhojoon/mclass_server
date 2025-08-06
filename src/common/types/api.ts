import { Request } from 'express';

// 기본 응답 타입 (공통 필드)
export interface BaseResponse {
  success: boolean;
}

// 성공 응답
export interface SuccessResponse<T = unknown> extends BaseResponse {
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
export type ApiResponse<T = unknown, E = unknown> =
  | SuccessResponse<T>
  | ErrorResponse<E>;

// 인증된 사용자 타입
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  isAdmin?: boolean;
}

// 인증된 요청 타입
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
