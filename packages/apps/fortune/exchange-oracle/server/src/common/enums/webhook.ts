export enum EventType {
  ESCROW_CREATED = 'escrow_created',
  ESCROW_COMPLETED = 'escrow_completed',
  ESCROW_CANCELED = 'escrow_canceled',
  TASK_CREATION_FAILED = 'task_creation_failed',
  SUBMISSION_REJECTED = 'submission_rejected',
  SUBMISSION_IN_REVIEW = 'submission_in_review',
}

export enum WebhookStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
