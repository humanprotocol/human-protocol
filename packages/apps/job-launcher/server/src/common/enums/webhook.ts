export enum EventType {
  ESCROW_CREATED = 'escrow_created',
  ESCROW_CANCELED = 'escrow_canceled',
  ESCROW_COMPLETED = 'escrow_completed',
  ESCROW_FAILED = 'escrow_failed',
  ABUSE_DETECTED = 'abuse_detected',
}

export enum OracleType {
  FORTUNE = 'fortune',
  CVAT = 'cvat',
  HCAPTCHA = 'hcaptcha',
}

export enum WebhookStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
