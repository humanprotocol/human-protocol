/* eslint-disable camelcase --- ... */
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useGetAllNetworks, useMyJobsFilterStore } from '../../hooks';

interface MyJobsNetworkFilterMobileProps {
  chainIdsEnabled: number[];
}

export function MyJobsNetworkFilterMobile({
  chainIdsEnabled,
}: MyJobsNetworkFilterMobileProps) {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();
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
