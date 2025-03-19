/* eslint-disable camelcase --- ... */
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useGetAllNetworks, useJobsFilterStore } from '../../hooks';

interface AvailableJobsNetworkFilterProps {
  chainIdsEnabled: number[];
  showClearButton?: boolean;
  showTitle?: boolean;
}

export function AvailableJobsNetworkFilter({
  chainIdsEnabled,
  showClearButton = false,
  showTitle = false,
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
      setFiltering={handleFilterChange}
      showClearButton={showClearButton}
      showTitle={showTitle}
    />
  );
}
