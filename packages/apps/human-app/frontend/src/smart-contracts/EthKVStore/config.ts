export enum Role {
  JobLauncher = 'Job launcher',
  ExchangeOracle = 'Exchange Oracle',
  ReputationOracle = 'Reputation Oracle',
  RecordingOracle = 'Recording Oracle',
}

export enum JobTypes {
  Fortune = 'Fortune',
  Points = 'Points',
  BoundingBoxes = 'Bounding Boxes',
  BoundingBoxesFromPoints = 'Bounding Boxes from points',
  SkeletonsFromBoundingBoxes = 'Skeletons from Bounding Boxes',
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
