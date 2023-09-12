export enum EventType {
  ESCROW_CREATED = 'escrow_created',
  ESCROW_CANCELED = 'escrow_canceled',
  TASK_REJECTED = 'task_rejected',
  TASK_CREATION_FAILED = 'task_creation_failed',
  TASK_COMPLETED = 'task_completed',
  TASK_FINISHED = 'task_finished'
}

export enum OracleType {
  FORTUNE = 'fortune',
  CVAT = 'cvat',
}