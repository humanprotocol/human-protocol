import capitalize from 'lodash/capitalize';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import { MyJobStatus } from '@/modules/worker/services/my-jobs-data';

export function AvailableJobsStatusFilterMobile() {
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
      filteringOptions={Object.values(MyJobStatus).map((status) => ({
        name: capitalize(status),
        option: status,
      }))}
      isChecked={(status) => status === filterParams.status}
      isMobile={false}
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
