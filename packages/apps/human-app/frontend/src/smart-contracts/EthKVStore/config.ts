export enum Role {
  JobLauncher = 'Job launcher',
  ExchangeOracle = 'Exchange Oracle',
  ReputationOracle = 'Reputation Oracle',
  RecordingOracle = 'Recording Oracle',
}

export const EthKVStoreKeys = {
  PublicKey: 'public_key',
  WebhookUrl: 'webhook_url',
  Role: 'role',
  Fee: 'fee',
} as const;

interface EthKVStoreValues {
  [EthKVStoreKeys.PublicKey]: string;
  [EthKVStoreKeys.WebhookUrl]: string;
  [EthKVStoreKeys.Role]: Role;
  [EthKVStoreKeys.Fee]: string;
}

export type SetBulkKey = keyof EthKVStoreValues;
export type SetBulkKeys = [
  typeof EthKVStoreKeys.PublicKey,
  typeof EthKVStoreKeys.WebhookUrl,
  typeof EthKVStoreKeys.Role,
  typeof EthKVStoreKeys.Fee,
];

export type SetBulkValues = [string, string, Role, string];
