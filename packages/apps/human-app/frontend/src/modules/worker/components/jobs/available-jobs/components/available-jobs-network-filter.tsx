/* eslint-disable camelcase --- ... */
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import { useGetAllNetworks } from '@/modules/worker/hooks/use-get-all-networks';

interface AvailableJobsNetworkFilterProps {
  chainIdsEnabled: number[];
  isMobile?: boolean;
}

export function AvailableJobsNetworkFilter({
  chainIdsEnabled,
  isMobile = false,
}: AvailableJobsNetworkFilterProps) {
  const { setFilterParams, filterParams } = useJobsFilterStore();
  const { allNetworks } = useGetAllNetworks(chainIdsEnabled);

  const updateFilterParams = (updates: Partial<typeof filterParams>) => {
    const baseUpdate = {
      ...filterParams,
      ...updates,
    };

    if (!isMobile) {
      baseUpdate.page = 0;
    }

    setFilterParams(baseUpdate);
  };

  return (
    <Filtering
      clear={() => {
        updateFilterParams({ chain_id: undefined });
      }}
      filteringOptions={allNetworks}
      isChecked={(option) => option === filterParams.chain_id}
      isMobile={isMobile}
      setFiltering={(chainId) => {
        updateFilterParams({ chain_id: chainId });
      }}
    />
  );
}
