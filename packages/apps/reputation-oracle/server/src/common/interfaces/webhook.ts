import { ChainId } from '@human-protocol/sdk';
import { IBase } from './base';
import { WebhookStatus } from '../enums/webhook';

export interface IWebhook extends IBase {
  signature: string;
  chainId: ChainId;
  escrowAddress: string;
  retriesCount?: number;
  status?: WebhookStatus;
  waitUntil?: Date;
}
