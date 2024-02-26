export enum EventType {
  ESCROW_CREATED = 'escrow_created',
  ESCROW_CANCELED = 'escrow_canceled',
  SUBMISSION_REJECTED = 'submission_rejected',
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
