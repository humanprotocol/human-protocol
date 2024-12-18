/* eslint-disable camelcase --- ... */
import { useMyJobsFilterStore } from '@/modules/worker/hooks/use-my-jobs-filter-store';
import { useGetAllNetworks } from '@/modules/worker/hooks/use-get-all-networks';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';

interface MyJobsNetworkFilterProps {
  chainIdsEnabled: number[];
}

export function MyJobsNetworkFilter({
  chainIdsEnabled,
}: MyJobsNetworkFilterProps) {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();
  const { allNetworks } = useGetAllNetworks(chainIdsEnabled);

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          ...filterParams,
          chain_id: undefined,
        });
      }}
      filteringOptions={allNetworks}
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
