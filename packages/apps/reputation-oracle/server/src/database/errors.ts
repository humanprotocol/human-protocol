import { BaseError } from '@/common/errors/base';

enum PostgresErrorCodes {
  Duplicated = '23505',
}

export class DatabaseError extends BaseError {}

export enum DatabaseErrorMessages {
  DUPLICATED = 'Entity duplication error',
}

export function handleDbError(error: any): DatabaseError {
  if (error.code === PostgresErrorCodes.Duplicated) {
    return new DatabaseError(DatabaseErrorMessages.DUPLICATED);
  }

  return new DatabaseError(error.message, error);
}

export function isDuplicatedError(error: unknown): boolean {
  return (
    error instanceof DatabaseError &&
    error.message === DatabaseErrorMessages.DUPLICATED
  );
}
