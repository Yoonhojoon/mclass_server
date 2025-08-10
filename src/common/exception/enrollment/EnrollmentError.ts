import { BaseError } from '../BaseError.js';

export class EnrollmentError extends BaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 400, originalError);
  }
}
