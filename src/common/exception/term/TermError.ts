import { BaseError } from '../BaseError';

export class TermError extends BaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 400, originalError);
  }
}
