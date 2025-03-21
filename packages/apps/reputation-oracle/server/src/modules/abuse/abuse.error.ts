import { ChainId } from '@human-protocol/sdk';
import { BaseError } from '../../common/errors/base';

export enum AbuseErrorMessage {
  AbuseNotFound = 'Received abuse not found',
  ManifestUrlDoesNotExist = 'Manifest url does not exist',
  UrlNotFound = 'Webhook url not found',
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
