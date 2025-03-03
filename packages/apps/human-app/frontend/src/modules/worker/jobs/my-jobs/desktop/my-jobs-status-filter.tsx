import capitalize from 'lodash/capitalize';
import { useMyJobsFilterStore } from '@/modules/worker/hooks/use-my-jobs-filter-store';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { MyJobStatus } from '@/modules/worker/services/my-jobs-data';

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
      filteringOptions={Object.values(MyJobStatus).map((status) => ({
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
