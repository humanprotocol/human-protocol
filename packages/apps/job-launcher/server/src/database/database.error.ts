import { QueryFailedError } from 'typeorm';
import { DatabaseErrorCodes, PostgresErrorCodes } from './database.enum';

export class DatabaseError extends Error {
  public readonly code: string;
  constructor(message: string, code: string, stack?: string) {
    super(message);
    this.code = code;
    if (stack) this.stack = stack;
  }
}

export function handleQueryFailedError(error: QueryFailedError): DatabaseError {
  const stack = error.stack || '';
  let message = error.message,
    code: string;

  switch ((error.driverError as any).code) {
    case PostgresErrorCodes.Duplicated:
      message = (error.driverError as any).detail;
      code = DatabaseErrorCodes.EntityDuplication;
      break;
    default:
      code = DatabaseErrorCodes.Unknown;
      break;
  }
  return new DatabaseError(message, code, stack);
}
