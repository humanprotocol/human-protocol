import { BaseError } from '../../common/errors/base';

export enum QualificationErrorMessage {
  INVALID_EXPIRATION_TIME = 'Qualification should be valid for at least %minValidity% day(s)',
  NOT_FOUND = 'Qualification not found',
  NO_WORKERS_FOUND = 'Workers not found',
  CANNOT_DETELE_ASSIGNED_QUALIFICATION = 'Cannot delete qualification because it is assigned to users',
}

export class QualificationError extends BaseError {
  reference: string;
  constructor(message: QualificationErrorMessage, reference: string) {
    super(message);
    this.reference = reference;
  }
}
