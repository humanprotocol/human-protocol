import { ChainId } from '@human-protocol/sdk';

export type IncomingWebhookData = {
  chainId: ChainId;
  eventType: IncomingWebhookEventType;
  escrowAddress: string;
  eventData?: Record<string, unknown>;
};

export enum IncomingWebhookEventType {
  JOB_COMPLETED = 'job_completed',
}

export enum OutgoingWebhookEventType {
  ESCROW_COMPLETED = 'escrow_completed',
  ABUSE_DETECTED = 'abuse_detected',
  ABUSE_DISMISSED = 'abuse_dismissed',
}

export enum IncomingWebhookStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum OutgoingWebhookStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}
