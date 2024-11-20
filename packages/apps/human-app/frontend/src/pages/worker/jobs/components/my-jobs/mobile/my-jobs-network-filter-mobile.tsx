/* eslint-disable camelcase --- ... */
import { useCallback } from 'react';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { getChainsEnabled } from '@/smart-contracts/chains';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { type ChainIdsEnabled } from '@/api/services/worker/oracles';

interface MyJobsNetworkFilterMobileProps {
  chainIdsEnabled: ChainIdsEnabled;
}

export function MyJobsNetworkFilterMobile({
  chainIdsEnabled,
}: MyJobsNetworkFilterMobileProps) {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();

  const allNetworks = useCallback(() => {
    return getChainsEnabled(chainIdsEnabled).map(({ chainId, name }) => ({
      option: chainId,
      name,
    }));
  }, [chainIdsEnabled]);

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          ...filterParams,
          chain_id: undefined,
          page: 0,
        });
      }}
      filteringOptions={allNetworks()}
      isChecked={(option) => option === filterParams.chain_id}
      isMobile={false}
      setFiltering={(chainId) => {
        setFilterParams({
          ...filterParams,
          chain_id: chainId,
          page: 0,
        });
      }}
    />
  );
}
