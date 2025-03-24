/* eslint-disable camelcase --- ... */
import { Filtering } from '@/shared/components/ui/table/table-header-menu/filtering';
import { useMyJobsFilterStore, useGetAllNetworks } from '../../../hooks';

interface MyJobsNetworkFilterMobileProps {
  chainIdsEnabled: number[];
}

export function MyJobsNetworkFilterMobile({
  chainIdsEnabled,
}: Readonly<MyJobsNetworkFilterMobileProps>) {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();
  const { allNetworks } = useGetAllNetworks(chainIdsEnabled);

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          chain_id: undefined,
          page: 0,
        });
      }}
      filteringOptions={allNetworks}
      isChecked={(option) => option === filterParams.chain_id}
      setFiltering={(chainId) => {
        setFilterParams({
          chain_id: chainId,
          page: 0,
        });
      }}
    />
  );
}
