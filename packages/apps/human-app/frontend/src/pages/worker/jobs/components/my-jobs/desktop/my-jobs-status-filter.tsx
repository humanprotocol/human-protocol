import capitalize from 'lodash/capitalize';
import {
  jobStatuses,
  useMyJobsFilterStore,
} from '@/hooks/use-my-jobs-filter-store';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';

export function MyJobsStatusFilter() {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          ...filterParams,
          status: undefined,
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
        });
      }}
    />
  );
}
