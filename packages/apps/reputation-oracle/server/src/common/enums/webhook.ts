export enum EventType {
  JOB_COMPLETED = 'job_completed',
  ESCROW_COMPLETED = 'escrow_completed',
  ABUSE_REPORTED = 'abuse_reported',
  RESUME_REPORTED_ABUSE = 'resume_reported_abuse',
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
