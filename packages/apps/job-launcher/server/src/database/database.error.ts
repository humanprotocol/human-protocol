import { HttpException, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export class DatabaseError extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    this.name = 'DatabaseError';
  }
}

export function handleQueryFailedError(error: QueryFailedError): DatabaseError {
  let errorMessage = error.message;

  switch ((error.driverError as any).code) {
    case '23505':
      errorMessage = 'Duplicated value';
      break;
    // Add more cases as needed
    default:
      break;
  }

  return new DatabaseError(errorMessage);
}
