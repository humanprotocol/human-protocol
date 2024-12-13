export enum EventType {
  JOB_COMPLETED = 'job_completed',
  ESCROW_COMPLETED = 'escrow_completed',
}

export enum WebhookIncomingStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum WebhookOutgoingStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum EscrowCompletionStatus {
  PENDING = 'pending',
  AWAITING_PAYMENTS = 'awaiting_payments',
  PAID = 'paid',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
