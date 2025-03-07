import { useMemo } from 'react';
import { getEnabledChainsByUiConfig } from '@/modules/smart-contracts/chains';

export const useGetAllNetworks = (chainIdsEnabled: number[]) => {
  const allNetworks = useMemo(() => {
    const chains = getEnabledChainsByUiConfig(chainIdsEnabled);

    return chains.map(({ chainId, name }) => ({
      option: chainId,
      name,
    }));
  }, [chainIdsEnabled]);

  return { allNetworks };
};
