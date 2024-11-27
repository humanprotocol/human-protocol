import { useMemo } from 'react';
import { chains, getChainsEnabled } from '@/smart-contracts/chains';

export const useGetAllNetworks = (chainIdsEnabled: number[] | undefined) => {
  const allNetworks = useMemo(() => {
    const chainsSelected = chainIdsEnabled
      ? getChainsEnabled(chainIdsEnabled)
      : chains;

    return chainsSelected.map(({ chainId, name }) => ({
      option: chainId,
      name,
    }));
  }, [chainIdsEnabled]);

  return { allNetworks };
};
