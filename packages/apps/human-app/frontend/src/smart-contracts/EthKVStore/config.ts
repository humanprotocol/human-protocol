export enum Role {
  JobLauncher = 'Job launcher',
  ExchangeOracle = 'Exchange Oracle',
  ReputationOracle = 'Reputation Oracle',
  RecordingOracle = 'Recording Oracle',
}

export const EthKVStoreKeys = {
  PublicKey: 'Public Key',
  WebhookUrl: 'Webhook Url',
  Role: 'Role',
  RecordingOracle: 'Recording Oracle',
} as const;

interface EthKVStoreValues {
  [EthKVStoreKeys.PublicKey]: string;
  [EthKVStoreKeys.WebhookUrl]: string;
  [EthKVStoreKeys.Role]: Role;
  [EthKVStoreKeys.RecordingOracle]: string;
}

export type SetBulkKey = keyof EthKVStoreValues;
export type SetBulkKeys = [
  typeof EthKVStoreKeys.PublicKey,
  typeof EthKVStoreKeys.WebhookUrl,
  typeof EthKVStoreKeys.Role,
  typeof EthKVStoreKeys.RecordingOracle,
];

export type SetBulkValues = [string, string, Role, string];
