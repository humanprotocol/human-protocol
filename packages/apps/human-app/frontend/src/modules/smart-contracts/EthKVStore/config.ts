import { Role } from '@human-protocol/sdk/src/constants';

export const OPERATOR_ROLES = [
  Role.ExchangeOracle,
  Role.JobLauncher,
  Role.RecordingOracle,
] as const;

export enum JobType {
  FORTUNE = 'fortune',
  POINTS = 'image_points',
  BOUNDING_BOXES = 'image_boxes',
  BOUNDING_BOXES_FROM_POINTS = 'image_boxes_from_points',
  SKELETONS_FROM_BOUNDING_BOXES = 'image_skeletons_from_boxes',
  POLYGONS = 'image_polygons',
  AUDIO_TRANSCRIPTION = 'audio_transcription',
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
