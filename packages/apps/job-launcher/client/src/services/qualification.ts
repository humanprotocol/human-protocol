import { ChainId } from '@human-protocol/sdk';
import { Qualification } from '../types';
import api from '../utils/api';

export const getQualifications = async (chainId: ChainId) => {
  const { data } = await api.get<Qualification[]>(`/qualification`, {
    params: { chainId },
  });

  return data;
};
