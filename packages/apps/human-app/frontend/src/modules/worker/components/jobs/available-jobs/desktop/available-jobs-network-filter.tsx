/* eslint-disable camelcase --- ... */
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import { useGetAllNetworks } from '@/modules/worker/hooks/use-get-all-networks';

interface AvailableJobsNetworkFilterProps {
  chainIdsEnabled: number[];
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
