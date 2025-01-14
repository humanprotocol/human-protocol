export enum ReputationEntityType {
  WORKER = 'worker',
  JOB_LAUNCHER = 'job_launcher',
  EXCHANGE_ORACLE = 'exchange_oracle',
  RECORDING_ORACLE = 'recording_oracle',
  REPUTATION_ORACLE = 'reputation_oracle',
  CREDENTIAL_VALIDATOR = 'credential_validator',
}

export enum ReputationLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ReputationOrderBy {
  CREATED_AT = 'created_at',
  REPUTATION_POINTS = 'reputation_points',
}
