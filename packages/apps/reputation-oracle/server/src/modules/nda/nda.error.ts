import { BaseError } from '../../common/errors/base';

export enum NDAErrorMessage {
  INVALID_NDA = 'Invalid NDA URL',
  NDA_EXISTS = 'User has already signed the NDA',
}

export class NDAError extends BaseError {
  userId: number;
  constructor(message: NDAErrorMessage, userId: number) {
    super(message);
    this.userId = userId;
  }
}
