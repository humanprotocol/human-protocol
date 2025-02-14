export enum EventType {
  ESCROW_CREATED = 'escrow_created',
  ESCROW_COMPLETED = 'escrow_completed',
  ESCROW_CANCELED = 'escrow_canceled',
  ESCROW_FAILED = 'escrow_failed',
  SUBMISSION_REJECTED = 'submission_rejected',
  SUBMISSION_IN_REVIEW = 'submission_in_review',
}

export enum WebhookStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
