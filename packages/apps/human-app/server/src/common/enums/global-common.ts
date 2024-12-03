export enum JobDiscoveryFieldName {
  JobDescription = 'job_description',
  RewardAmount = 'reward_amount',
  RewardToken = 'reward_token',
  CreatedAt = 'created_at',
  Qualifications = 'qualifications',
}

export enum JobStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

export enum AssignmentStatus {
  ACTIVE = 'active',
  VALIDATION = 'validation',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELED = 'canceled',
  REJECTED = 'rejected',
}

export enum JobDiscoverySortField {
  CHAIN_ID = 'chain_id',
  JOB_TYPE = 'job_type',
  REWARD_AMOUNT = 'reward_amount',
  CREATED_AT = 'created_at',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum AssignmentSortField {
  CHAIN_ID = 'chain_id',
  JOB_TYPE = 'job_type',
  STATUS = 'status',
  REWARD_AMOUNT = 'reward_amount',
  CREATED_AT = 'created_at',
  EXPIRES_AT = 'expires_at',
}

export enum SignatureType {
  SIGNUP = 'signup',
  SIGNIN = 'signin',
  DISABLE_OPERATOR = 'disable_operator',
  CERTIFICATE_AUTHENTICATION = 'certificate_authentication',
  REGISTER_ADDRESS = 'register_address',
}
