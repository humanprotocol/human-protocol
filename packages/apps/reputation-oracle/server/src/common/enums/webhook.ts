export enum EventType {
  JOB_COMPLETED = 'job_completed',
  ESCROW_COMPLETED = 'escrow_completed',
}

export enum WebhookStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAID = 'PAID',
}

export enum WebhookType {
  IN = 'in',
  OUT = 'out',
}
