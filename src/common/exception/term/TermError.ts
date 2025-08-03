import { BaseError } from '../BaseError';

export class TermError extends BaseError {
  constructor(message: string, originalError?: any) {
    super(message, 400, originalError);
  }
} 