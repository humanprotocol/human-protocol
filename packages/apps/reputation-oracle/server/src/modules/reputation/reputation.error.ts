import { ChainId } from '@human-protocol/sdk';
import { BaseError } from '../../common/errors/base';

export enum ReputationErrorMessage {
  NOT_FOUND = 'Reputation not found',
}

export class ReputationError extends BaseError {
  chainId: ChainId;
  address: string;
  constructor(
    message: ReputationErrorMessage,
    chainId: ChainId,
    address: string,
  ) {
    super(message);
    this.chainId = chainId;
    this.address = address;
  }
}
