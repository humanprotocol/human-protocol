import { BaseError } from '@/common/errors/base';

export enum NDAErrorMessage {
  INVALID_NDA = 'Invalid NDA URL',
}

export class NDAError extends BaseError {
  userId: number;
  constructor(message: NDAErrorMessage, userId: number) {
    super(message);
    this.userId = userId;
  }
}
