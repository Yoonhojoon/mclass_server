import { Response } from 'express';
import { SuccessResponse } from '../types/api.js';

export class BaseSuccess<T = unknown> {
  protected data?: T;
  protected message?: string;
  protected statusCode: number;
  protected successCode: string;
  protected meta?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'SUCCESS',
    data?: T,
    meta?: Record<string, unknown>
  ) {
    this.message = message;
    this.statusCode = statusCode;
    this.successCode = successCode;
    this.data = data;
    this.meta = meta;
  }

  /**
   * 표준 응답 형식으로 변환
   */
  toResponse(): SuccessResponse<T> {
    const response: SuccessResponse<T> = {
      success: true,
      data: this.data as T,
    };

    if (this.message) {
      response.message = this.message;
    }

    if (this.successCode) {
      response.code = this.successCode;
    }

    if (this.meta) {
      response.meta = this.meta;
    }

    return response;
  }

  /**
   * 응답을 직접 전송
   */
  send(res: Response): void {
    res.status(this.statusCode).json(this.toResponse());
  }

  /**
   * 204 No Content 응답 전송
   */
  static noContent(res: Response): void {
    res.status(204).send();
  }
}
