import { QueryFailedError } from 'typeorm';
import { DatabaseError } from '.';
import { PostgresErrorCodes } from '../enums/database';

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
