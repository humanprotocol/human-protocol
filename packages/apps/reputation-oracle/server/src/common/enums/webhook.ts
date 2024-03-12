export enum EventType {
  TASK_COMPLETED = 'task_completed',
  ESCROW_COMPLETED = 'escrow_completed',
}

export enum WebhookStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAID = 'PAID',
}

export enum OracleType {
  FORTUNE = 'fortune',
  CVAT = 'cvat',
}
