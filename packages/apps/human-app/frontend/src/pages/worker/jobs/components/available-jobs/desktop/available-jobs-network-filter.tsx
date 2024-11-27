/* eslint-disable camelcase --- ... */
import { useGetAllNetworks } from '@/hooks/use-get-all-networks';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';

interface AvailableJobsNetworkFilterProps {
  chainIdsEnabled: number[] | undefined;
}

export function AvailableJobsNetworkFilter({
  chainIdsEnabled,
}: AvailableJobsNetworkFilterProps) {
  const { setFilterParams, filterParams } = useJobsFilterStore();
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
