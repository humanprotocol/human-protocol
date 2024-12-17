/* eslint-disable camelcase --- ... */
import { useMyJobsFilterStore } from '@/modules/worker/hooks/use-my-jobs-filter-store';
import { chains } from '@/modules/smart-contracts/chains';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';

const allNetworks = chains.map(({ chainId, name }) => ({
  option: chainId,
  name,
}));

export function MyJobsNetworkFilterMobile() {
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
