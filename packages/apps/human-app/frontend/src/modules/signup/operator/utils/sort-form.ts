import type { EthKVStoreKeyValues } from '@/modules/smart-contracts/EthKVStore/config';
import { EthKVStoreKeys } from '@/modules/smart-contracts/EthKVStore/config';

export const sortFormKeys = (
  keys: EthKVStoreKeyValues[],
  order: EthKVStoreKeyValues[]
): EthKVStoreKeyValues[] => {
  return keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
};

export const STORE_KEYS_ORDER: EthKVStoreKeyValues[] = [
  EthKVStoreKeys.Fee,
  EthKVStoreKeys.PublicKey,
  EthKVStoreKeys.Url,
  EthKVStoreKeys.WebhookUrl,
  EthKVStoreKeys.Role,
  EthKVStoreKeys.JobTypes,
];
