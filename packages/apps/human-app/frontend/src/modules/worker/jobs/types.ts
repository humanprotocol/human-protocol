export enum MyJobStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
  VALIDATION = 'VALIDATION',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
}

export const UNKNOWN_JOB_STATUS = 'UNKNOWN';

export enum SortField {
  CHAIN_ID = 'chain_id',
  JOB_TYPE = 'job_type',
  REWARD_AMOUNT = 'reward_amount',
  CREATED_AT = 'created_at',
  ESCROW_ADDRESS = 'escrow_address',
  EXPIRES_AT = 'expires_at',
}

export type SortDirection = 'asc' | 'desc';
