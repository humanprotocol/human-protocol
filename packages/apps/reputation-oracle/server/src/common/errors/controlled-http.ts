import { HttpStatus } from '@nestjs/common';
import { BaseError } from './base';

export class ControlledHttpError extends BaseError {
  constructor(
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
