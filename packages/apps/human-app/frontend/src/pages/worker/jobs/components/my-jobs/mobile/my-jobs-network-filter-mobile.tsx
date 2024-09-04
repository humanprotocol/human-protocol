/* eslint-disable camelcase --- ... */
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { chains } from '@/smart-contracts/chains';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';

const allNetworks = chains.map(({ chainId, name }) => ({
  option: chainId,
  name,
}));

export function MyJobsNetworkFilter() {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();

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
