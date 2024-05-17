import { HttpStatus } from '@nestjs/common';

export class ControlledError extends Error {
  status: HttpStatus;

  constructor(message: string, status: HttpStatus, stack?: string) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    if (stack) this.stack = stack;
    else Error.captureStackTrace(this, this.constructor);
  }
}
