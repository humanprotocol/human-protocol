export enum JobStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum JobSortField {
  CHAIN_ID = 'chain_id',
  JOB_TYPE = 'job_type',
  REWARD_AMOUNT = 'reward_amount',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

export enum JobFieldName {
  JobDescription = 'job_description',
  RewardAmount = 'reward_amount',
  RewardToken = 'reward_token',
  CreatedAt = 'created_at',
  UpdatedAt = 'updated_at',
}

export enum AssignmentStatus {
  ACTIVE = 'ACTIVE',
  VALIDATION = 'VALIDATION',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
  REJECTED = 'REJECTED',
}

export enum AssignmentSortField {
  CHAIN_ID = 'chain_id',
  JOB_TYPE = 'job_type',
  STATUS = 'status',
  REWARD_AMOUNT = 'reward_amount',
  CREATED_AT = 'created_at',
  EXPIRES_AT = 'expires_at',
}

export enum JobType {
  FORTUNE = 'FORTUNE',
}
