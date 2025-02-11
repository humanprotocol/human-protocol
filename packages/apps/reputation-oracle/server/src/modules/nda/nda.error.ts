import { BaseError } from '../../common/errors/base';

export enum NdaErrorMessage {
  NDA_NOT_FOUND = 'NDA not found',
}

export class NdaError extends BaseError {
  userId: number;
  constructor(message: NdaErrorMessage, userId: number) {
    super(message);
    this.userId = userId;
  }
}
