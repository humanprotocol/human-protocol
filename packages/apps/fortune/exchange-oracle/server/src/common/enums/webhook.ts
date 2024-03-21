export enum EventType {
  ESCROW_CREATED = 'escrow_created',
  ESCROW_CANCELED = 'escrow_canceled',
  TASK_CREATION_FAILED = 'task_creation_failed',
  SUBMISSION_REJECTED = 'submission_rejected',
}

export enum WebhookStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
