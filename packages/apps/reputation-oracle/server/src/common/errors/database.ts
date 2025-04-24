import { QueryFailedError } from 'typeorm';
import { BaseError } from './base';

export enum PostgresErrorCodes {
  Duplicated = '23505',
  NumericFieldOverflow = '22003',
}

export class DatabaseError extends BaseError {}

export function handleQueryFailedError(error: QueryFailedError): DatabaseError {
  let message: string;

  switch ((error.driverError as any).code) {
    case PostgresErrorCodes.Duplicated:
      message =
        (error.driverError as any).detail + (error.driverError as any).code;
      break;
    case PostgresErrorCodes.NumericFieldOverflow:
      message = 'Incorrect amount';
      break;
    default:
      message = error.message;
      break;
  }

  return new DatabaseError(message, error);
}

export function isDuplicatedError(error: unknown): boolean {
  return (
    error instanceof DatabaseError &&
    error.message.includes(PostgresErrorCodes.Duplicated)
  );
}
