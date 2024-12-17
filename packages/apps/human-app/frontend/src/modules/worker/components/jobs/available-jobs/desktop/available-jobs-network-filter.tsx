/* eslint-disable camelcase --- ... */
import { chains } from '@/modules/smart-contracts/chains';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';

const allNetworks = chains.map(({ chainId, name }) => ({
  option: chainId,
  name,
}));

export function AvailableJobsNetworkFilter() {
  const { setFilterParams, filterParams } = useJobsFilterStore();

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          ...filterParams,
          chain_id: undefined,
        });
      }}
      filteringOptions={allNetworks}
      isChecked={(option) => option === filterParams.chain_id}
      setFiltering={(chainId) => {
        setFilterParams({
          ...filterParams,
          chain_id: chainId,
        });
      }}
    />
  );
}
