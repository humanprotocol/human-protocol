import {
  getTestnetChainsEnabled,
  getMainnetChainsEnabled,
} from '@/smart-contracts/chains';
import { env } from '@/shared/env';
import { type ChainIdsEnabled } from '@/api/services/worker/oracles';

export const getNetworkName = (
  chainIdsEnabled: ChainIdsEnabled,
  chainId: number
): string => {
  if (env.VITE_NETWORK === 'testnet') {
    return (
      getTestnetChainsEnabled(chainIdsEnabled).find(
        (el) => el.chainId === chainId
      )?.name ?? ''
    );
  }
  return (
    getMainnetChainsEnabled(chainIdsEnabled).find(
      (el) => el.chainId === chainId
    )?.name ?? ''
  );
};
