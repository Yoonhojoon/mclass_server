import { SuccessResponse } from '../types/api.js';

export class BaseSuccess<T = unknown> {
  protected data: T;
  protected message?: string;
  protected statusCode: number;
  protected successCode: string;

  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'SUCCESS',
    data?: T
  ) {
    this.message = message;
    this.statusCode = statusCode;
    this.successCode = successCode;
    this.data = data as T;
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
      (response as unknown as Record<string, unknown>).message = this.message;
    }

    return response;
  }
}
