export abstract class BaseSuccess {
  public readonly message: string;
  public readonly statusCode: number;
  public readonly successCode: string;
  public readonly data?: any;

  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'SUCCESS',
    data?: any
  ) {
    this.message = message;
    this.statusCode = statusCode;
    this.successCode = successCode;
    this.data = data;
  }

  toJSON() {
    return {
      success: true,
      message: this.message,
      statusCode: this.statusCode,
      successCode: this.successCode,
      data: this.data,
      timestamp: new Date().toISOString()
    };
  }
} 