import { HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export class DatabaseError extends Error {
  public readonly code: string;
  constructor(message: string, code: string, stack: string) {
    super(message);
    this.code = code;
    this.stack = stack;
  }
}

export function handleQueryFailedError(error: QueryFailedError): DatabaseError {
  let message = error.message,
    code: string;
  const stack = error.stack || '';

  switch ((error.driverError as any).code) {
    case '23505':
      message = (error.driverError as any).detail;
      code = String(HttpStatus.UNPROCESSABLE_ENTITY);
      break;
    // Add more cases as needed
    default:
      code = String(HttpStatus.INTERNAL_SERVER_ERROR);
      break;
  }
  return new DatabaseError(message, code, stack);
}
