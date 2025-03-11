/* eslint-disable camelcase --- ... */
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useGetAllNetworks, useJobsFilterStore } from '../../hooks';

interface AvailableJobsNetworkFilterProps {
  chainIdsEnabled: number[];
  isMobile?: boolean;
}

export function AvailableJobsNetworkFilter({
  chainIdsEnabled,
  isMobile = false,
}: Readonly<AvailableJobsNetworkFilterProps>) {
  const { setFilterParams, filterParams } = useJobsFilterStore();
  const { allNetworks } = useGetAllNetworks(chainIdsEnabled);

  const handleClear = () => {
    setFilterParams({ chain_id: undefined });
  };

  const handleFilterChange = (chainId: number) => {
    setFilterParams({ chain_id: chainId });
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
