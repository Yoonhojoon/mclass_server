export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SuccessResponse<T> extends ApiResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse extends ApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
