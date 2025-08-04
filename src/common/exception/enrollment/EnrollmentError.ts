import { BaseError } from '../BaseError';

export class EnrollmentError extends BaseError {
export class EnrollmentError extends BaseError {
  constructor(message: string, originalError?: any) {
    super(message, 400, originalError);
  }
}
} 