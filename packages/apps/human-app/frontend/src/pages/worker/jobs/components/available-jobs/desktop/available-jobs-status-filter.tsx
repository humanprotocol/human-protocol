import capitalize from 'lodash/capitalize';
import { jobStatuses } from '@/hooks/use-my-jobs-filter-store';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';

export function AvailableJobsStatusFilter() {
  const { setFilterParams, filterParams } = useJobsFilterStore();

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          ...filterParams,
          status: undefined,
          page: 0,
        });
      }}
      filteringOptions={jobStatuses.map((status) => ({
        name: capitalize(status),
        option: status,
      }))}
      isChecked={(status) => status === filterParams.status}
      setFiltering={(status) => {
        setFilterParams({
          ...filterParams,
          status,
          page: 0,
        });
      }}
    />
  );
}
