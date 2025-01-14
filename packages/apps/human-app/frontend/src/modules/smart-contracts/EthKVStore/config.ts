export enum Role {
  JobLauncher = 'Job Launcher',
  ExchangeOracle = 'Exchange Oracle',
  ReputationOracle = 'Reputation Oracle',
  RecordingOracle = 'Recording Oracle',
}

export enum JobType {
  Fortune = 'fortune',
  Points = 'image_points',
  BoundingBoxes = 'image_boxes',
  BoundingBoxesFromPoints = 'image_boxes_from_points',
  SkeletonsFromBoundingBoxes = 'image_skeletons_from_boxes',
  Polygons = 'image_polygons',
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
