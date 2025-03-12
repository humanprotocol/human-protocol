/* eslint-disable camelcase --- ... */
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useIsMobile } from '@/shared/hooks';
import { useMyJobsFilterStore, useGetAllNetworks } from '../../../hooks';

interface MyJobsNetworkFilterProps {
  chainIdsEnabled: number[];
}

export function MyJobsNetworkFilter({
  chainIdsEnabled,
}: Readonly<MyJobsNetworkFilterProps>) {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();
  const { allNetworks } = useGetAllNetworks(chainIdsEnabled);
  const isMobile = useIsMobile();

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
      isMobile={isMobile}
    />
  );
}
