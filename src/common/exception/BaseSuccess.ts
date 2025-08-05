import { SuccessResponse } from '../types/api.js';

export class BaseSuccess<T = any> {
  protected data: T;
  protected message?: string;

  constructor(data: T, message?: string) {
    this.data = data;
    this.message = message;
  }

  /**
   * 표준 응답 형식으로 변환
   */
  toResponse(): SuccessResponse<T> {
    const response: SuccessResponse<T> = {
      success: true,
      data: this.data,
    };

    if (this.message) {
      (response as any).message = this.message;
    }

    return response;
  }
}
