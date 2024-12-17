/* eslint-disable camelcase --- ... */
import { chains } from '@/modules/smart-contracts/chains';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';

const allNetworks = chains.map(({ chainId, name }) => ({
  option: chainId,
  name,
}));

export function AvailableJobsNetworkFilterMobile() {
  const { setFilterParams, filterParams } = useJobsFilterStore();

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
