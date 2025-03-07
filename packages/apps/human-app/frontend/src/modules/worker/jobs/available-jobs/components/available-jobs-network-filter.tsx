/* eslint-disable camelcase --- ... */
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useFilterUpdates, useGetAllNetworks } from '../../hooks';

interface AvailableJobsNetworkFilterProps {
  chainIdsEnabled: number[];
  isMobile?: boolean;
}

export function AvailableJobsNetworkFilter({
  chainIdsEnabled,
  isMobile = false,
}: Readonly<AvailableJobsNetworkFilterProps>) {
  const { filterParams, updateFilterParams } = useFilterUpdates({ isMobile });
  const { allNetworks } = useGetAllNetworks(chainIdsEnabled);

  const handleClear = () => {
    updateFilterParams({ chain_id: undefined });
  };

  const handleFilterChange = (chainId: number) => {
    updateFilterParams({ chain_id: chainId });
  };

  return (
    <Filtering
      clear={handleClear}
      filteringOptions={allNetworks}
      isChecked={(option) => option === filterParams.chain_id}
      isMobile={isMobile}
      setFiltering={handleFilterChange}
    />
  );
}
