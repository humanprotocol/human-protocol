export enum EventType {
  ESCROW_CREATED = 'escrow_created',
  ESCROW_CANCELED = 'escrow_canceled',
  ESCROW_COMPLETED = 'escrow_completed',
  TASK_CREATION_FAILED = 'task_creation_failed',
  ESCROW_FAILED = 'escrow_failed',
}

export enum OracleType {
  FORTUNE = 'fortune',
  CVAT = 'cvat',
  HCAPTCHA = 'hcaptcha',
}

export enum WebhookStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
