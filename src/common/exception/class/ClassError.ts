import { BaseError } from '../BaseError';

export class ClassError extends BaseError {
export class ClassError extends BaseError {
  constructor(message: string, originalError?: any) {
    super(message, 400, originalError);
  }
}
} 