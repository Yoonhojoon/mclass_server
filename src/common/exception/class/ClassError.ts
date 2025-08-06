import { BaseError } from '../BaseError.js';

export class ClassError extends BaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 400, originalError);
  }
}
