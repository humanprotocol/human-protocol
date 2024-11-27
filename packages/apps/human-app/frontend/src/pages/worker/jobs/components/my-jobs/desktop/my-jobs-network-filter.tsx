/* eslint-disable camelcase --- ... */
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { useGetAllNetworks } from '@/hooks/use-get-all-networks';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';

interface MyJobsNetworkFilterProps {
  chainIdsEnabled: number[] | undefined;
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
