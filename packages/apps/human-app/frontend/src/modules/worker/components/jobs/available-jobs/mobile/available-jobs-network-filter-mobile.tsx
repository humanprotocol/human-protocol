/* eslint-disable camelcase --- ... */
import { useGetAllNetworks } from '@/modules/worker/hooks/use-get-all-networks';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';

interface AvailableJobsNetworkFilterProps {
  chainIdsEnabled: number[];
}

export function AvailableJobsNetworkFilterMobile({
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
          page: 0,
        });
      }}
      filteringOptions={allNetworks}
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
