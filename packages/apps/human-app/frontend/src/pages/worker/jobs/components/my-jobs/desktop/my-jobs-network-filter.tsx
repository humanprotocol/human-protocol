/* eslint-disable camelcase --- ... */
import { useCallback } from 'react';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { getChainsEnabled, chains } from '@/smart-contracts/chains';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { type ChainIdsEnabled } from '@/api/services/worker/oracles';

interface MyJobsNetworkFilterProps {
  chainIdsEnabled: ChainIdsEnabled | undefined;
}

export function MyJobsNetworkFilter({
  chainIdsEnabled,
}: MyJobsNetworkFilterProps) {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();

  const getAllNetworks = useCallback(() => {
    const chainsSelected = chainIdsEnabled
      ? getChainsEnabled(chainIdsEnabled)
      : chains;

    return chainsSelected.map(({ chainId, name }) => ({
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
        });
      }}
      filteringOptions={getAllNetworks()}
      isChecked={(option) => option === filterParams.chain_id}
      setFiltering={(chainId) => {
        setFilterParams({
          ...filterParams,
          chain_id: chainId,
        });
      }}
    />
  );
}
