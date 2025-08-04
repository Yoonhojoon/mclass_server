import { BaseError } from '../BaseError';

export class ClassError extends BaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 400, originalError);
  }
}
