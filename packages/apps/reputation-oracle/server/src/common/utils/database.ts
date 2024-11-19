import { PostgresErrorCodes } from '../enums/database';
import { DatabaseError } from '../errors/database';

export function isDuplicatedError(error: any): boolean {
  return (
    error instanceof DatabaseError &&
    error.message.includes(PostgresErrorCodes.Duplicated)
  );
}
