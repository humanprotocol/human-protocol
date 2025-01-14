import { ChainId } from '@human-protocol/sdk';
import { BaseError } from '../../common/errors/base';

export enum WebhookErrorMessage {
  URL_NOT_FOUND = 'Webhook url not found',
  INVALID_EVENT_TYPE = 'Invalid event type',
  NOT_SENT = 'Webhook was not sent',
  PENDING_PROCESSING_FAILED = 'Failed to process pending webhook',
}

export class IncomingWebhookError extends BaseError {
  chainId: ChainId;
  address: string;
  constructor(message: WebhookErrorMessage, chainId: ChainId, address: string) {
    super(message);
    this.chainId = chainId;
    this.address = address;
  }
}

export class OutgoingWebhookError extends BaseError {
  hash: string;
  constructor(message: WebhookErrorMessage, hash: string) {
    super(message);
    this.hash = hash;
  }
}
