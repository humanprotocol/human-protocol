import { ChainId } from '@human-protocol/sdk';
import { BaseError } from '../../common/errors/base';

export enum AbuseErrorMessage {
  ABUSE_NOT_FOUND = 'Received abuse not found',
}

export class AbuseError extends BaseError {
  escrowAddress: string;
  chainId: ChainId;
  constructor(
    message: AbuseErrorMessage,
    escrowAddress: string,
    chainId: ChainId,
  ) {
    super(message);
    this.escrowAddress = escrowAddress;
    this.chainId = chainId;
  }
}
