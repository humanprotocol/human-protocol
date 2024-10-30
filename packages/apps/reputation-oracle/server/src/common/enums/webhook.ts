export enum EventType {
  JOB_COMPLETED = 'job_completed',
  ESCROW_COMPLETED = 'escrow_completed',
}

export enum WebhookStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAID = 'paid',
}

export enum WebhookType {
  IN = 'in',
  OUT = 'out',
}
