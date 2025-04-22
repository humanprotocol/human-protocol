export enum EventType {
  JOB_COMPLETED = 'job_completed',
  ESCROW_COMPLETED = 'escrow_completed',
  ABUSE_DETECTED = 'abuse_detected',
  ABUSE_DISMISSED = 'abuse_dismissed',
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
  AWAITING_PAYOUTS = 'awaiting_payouts',
  PAID = 'paid',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
