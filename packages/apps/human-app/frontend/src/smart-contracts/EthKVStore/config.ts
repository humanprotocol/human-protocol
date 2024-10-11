export enum Role {
  JobLauncher = 'Job Launcher',
  ExchangeOracle = 'Exchange Oracle',
  ReputationOracle = 'Reputation Oracle',
  RecordingOracle = 'Recording Oracle',
}

export enum JobType {
  Fortune = 'FORTUNE',
  Points = 'IMAGE_POINTS',
  BoundingBoxes = 'IMAGE_BOXES',
  BoundingBoxesFromPoints = 'IMAGE_BOXES_FROM_POINTS',
  SkeletonsFromBoundingBoxes = 'IMAGE_SKELETONS_FROM_BOXES',
}

export const EthKVStoreKeys = {
  PublicKey: 'public_key',
  Url: 'url',
  WebhookUrl: 'webhook_url',
  Role: 'role',
  Fee: 'fee',
  JobTypes: 'job_types',
} as const;

export type EthKVStoreKeyValues =
  (typeof EthKVStoreKeys)[keyof typeof EthKVStoreKeys];

export type SetBulkKeys = string[];

export type SetBulkValues = string[];
export interface SetOperatorPayload {
  keys: SetBulkKeys;
  values: SetBulkValues;
}

export type KYCKey = `KYC-${string}`;
export interface SetKYCPayload {
  keys: [KYCKey];
  values: [string];
}
