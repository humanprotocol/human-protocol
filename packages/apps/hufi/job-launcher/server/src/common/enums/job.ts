export enum JobStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  LAUNCHED = 'LAUNCHED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TO_CANCEL = 'TO_CANCEL',
  CANCELED = 'CANCELED',
}

export enum JobStatusFilter {
  PENDING = 'PENDING',
  LAUNCHED = 'LAUNCHED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export enum JobRequestType {
  CAMPAIGN = 'CAMPAIGN',
}
