export enum JobStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
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
  Qualifications = 'qualifications',
}

export enum AssignmentStatus {
  ACTIVE = 'active',
  VALIDATION = 'validation',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELED = 'canceled',
  REJECTED = 'rejected',
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
  FORTUNE = 'fortune',
}
