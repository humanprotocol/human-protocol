/* eslint-disable camelcase --- ... */
import { Filtering } from '@/shared/components/ui/table/table-header-menu/filtering';
import { useMyJobsFilterStore, useGetAllNetworks } from '../../../hooks';

interface MyJobsNetworkFilterProps {
  chainIdsEnabled: number[];
}

export function MyJobsNetworkFilter({
  chainIdsEnabled,
}: Readonly<MyJobsNetworkFilterProps>) {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();
  const { allNetworks } = useGetAllNetworks(chainIdsEnabled);

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          chain_id: undefined,
        });
      }}
      filteringOptions={allNetworks}
      isChecked={(option) => option === filterParams.chain_id}
      setFiltering={(chainId) => {
        setFilterParams({
          chain_id: chainId,
        });
      }}
      showClearButton
      showTitle
    />
  );
}
