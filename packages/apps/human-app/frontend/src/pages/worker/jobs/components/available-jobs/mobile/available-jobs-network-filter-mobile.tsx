/* eslint-disable camelcase --- ... */
import { useCallback } from 'react';
import { getChainsEnabled } from '@/smart-contracts/chains';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { type ChainIdsEnabled } from '@/api/services/worker/oracles';

interface AvailableJobsNetworkFilterMobileProps {
  chainIdsEnabled: ChainIdsEnabled;
}

export function AvailableJobsNetworkFilterMobile({
  chainIdsEnabled,
}: AvailableJobsNetworkFilterMobileProps) {
  const { setFilterParams, filterParams } = useJobsFilterStore();

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
