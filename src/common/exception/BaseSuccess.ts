export abstract class BaseSuccess<T = unknown> {
  public readonly message: string;
  public readonly statusCode: number;
  public readonly successCode: string;
  public readonly data?: T;

  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'SUCCESS',
    data?: T
  ) {
    this.message = message;
    this.statusCode = statusCode;
    this.successCode = successCode;
    this.data = data;
  }

  toJSON(): Record<string, unknown> {
    return {
      success: true,
      message: this.message,
      statusCode: this.statusCode,
      successCode: this.successCode,
      data: this.data,
      timestamp: new Date().toISOString(),
    };
  }
}
