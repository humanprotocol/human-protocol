export enum ReputationEntityType {
  WORKER = 'WORKER',
  JOB_LAUNCHER = 'JOB_LAUNCHER',
  EXCHANGE_ORACLE = 'EXCHANGE_ORACLE',
  RECORDING_ORACLE = 'RECORDING_ORACLE',
  REPUTATION_ORACLE = 'REPUTATION_ORACLE',
}

export enum ReputationScore {
  LOW = 'Low' /* 0 - 299 */,
  MEDIUM = 'Medium' /* 300 - 699 */,
  HIGH = 'High' /* 700 - 1000 */,
}
