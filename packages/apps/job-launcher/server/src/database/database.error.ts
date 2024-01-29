import { QueryFailedError } from 'typeorm';

export enum DatabaseErrorCodes {
  EntityDuplication = 'ENTITY_DUPLICATION',
  Unknown = 'UNKNOWN',
}

export class DatabaseError extends Error {
  public readonly code: string;
  constructor(message: string, code: string, stack: string) {
    super(message);
    this.code = code;
    this.stack = stack;
  }
}

export function handleQueryFailedError(error: QueryFailedError): DatabaseError {
  const stack = error.stack || '';
  let message = error.message,
    code: string;

  switch ((error.driverError as any).code) {
    case '23505':
      message = (error.driverError as any).detail;
      code = DatabaseErrorCodes.EntityDuplication;
      break;
    default:
      code = DatabaseErrorCodes.Unknown;
      break;
  }
  return new DatabaseError(message, code, stack);
}
