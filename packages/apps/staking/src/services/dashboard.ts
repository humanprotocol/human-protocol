import { IKVStore } from '@human-protocol/sdk';
import api from '../utils/api';

export const getKVStoreData = async (
  address: string,
  chainId: number
): Promise<IKVStore[]> => {
  const response = await api.get(`details/kvstore/${address}`, {
    params: { chain_id: chainId },
  });

  // Validate if response is IKVStore[]
  if (
    Array.isArray(response.data) &&
    response.data.every((item) => 'key' in item && 'value' in item)
  ) {
    return response.data;
  }
  return [];
};
