export enum ReputationLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ReputationEntityType {
  WORKER = 'worker',
  JOB_LAUNCHER = 'job_launcher',
  EXCHANGE_ORACLE = 'exchange_oracle',
  RECORDING_ORACLE = 'recording_oracle',
  REPUTATION_ORACLE = 'reputation_oracle',
}

export enum ReputationOrderBy {
  CREATED_AT = 'createdAt',
  REPUTATION_POINTS = 'reputationPoints',
}

export const MAX_REPUTATION_ITEMS_PER_PAGE = 100;
