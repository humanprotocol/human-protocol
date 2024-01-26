import { QueryFailedError } from 'typeorm';
import { DatabaseError } from './database.error';

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
