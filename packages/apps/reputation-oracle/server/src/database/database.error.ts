import { QueryFailedError } from 'typeorm';
import { PostgresErrorCodes } from './database.enum';

export class DatabaseError extends Error {
  constructor(message: string, stack: string) {
    super(message);
    this.stack = stack;
  }
}

export function handleQueryFailedError(error: QueryFailedError): DatabaseError {
  const stack = error.stack || '';
  let message = error.message;

  switch ((error.driverError as any).code) {
    case PostgresErrorCodes.Duplicated:
      message = (error.driverError as any).detail;
      break;
    case PostgresErrorCodes.NumericFieldOverflow:
      message = 'Incorrect amount';
      break;
    default:
      break;
  }
  return new DatabaseError(message, stack);
}
