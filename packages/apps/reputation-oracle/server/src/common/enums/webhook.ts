export enum IncomingWebhookEventType {
  JOB_COMPLETED = 'job_completed',
}

export enum OutgoingWebhookEventType {
  JOB_COMPLETED = 'job_completed',
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

// TODO: Move to escrow completion module
export enum EscrowCompletionStatus {
  PENDING = 'pending',
  AWAITING_PAYOUTS = 'awaiting_payouts',
  PAID = 'paid',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
