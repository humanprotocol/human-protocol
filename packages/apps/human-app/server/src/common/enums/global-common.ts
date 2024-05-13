export enum JobDiscoveryFieldName {
  JobDescription = 'job_description',
  RewardAmount = 'reward_amount',
  RewardToken = 'reward_token',
  CreatedAt = 'created_at',
}
export enum JobStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}
export enum AssignmentStatus {
  ACTIVE = 'ACTIVE',
  VALIDATION = 'VALIDATION',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
  REJECTED = 'REJECTED',
}
export enum JobDiscoverySortField {
  CHAIN_ID = 'chain_id',
  JOB_TYPE = 'job_type',
  REWARD_AMOUNT = 'reward_amount',
  CREATED_AT = 'created_at',
}
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
export enum AssignmentSortField {
  CHAIN_ID = 'chain_id',
  JOB_TYPE = 'job_type',
  STATUS = 'status',
  REWARD_AMOUNT = 'reward_amount',
  CREATED_AT = 'created_at',
  EXPIRES_AT = 'expires_at',
}
export enum PrepareSignatureType {
  SIGNUP = 'SIGNUP',
  DISABLE_OPERATOR = 'DISABLE_OPERATOR',
}
