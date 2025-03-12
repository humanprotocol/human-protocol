import capitalize from 'lodash/capitalize';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useMyJobsFilterStore } from '../../../hooks';
import { MyJobStatus } from '../../../types';

export function MyJobsStatusFilterMobile() {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          status: undefined,
          page: 0,
        });
      }}
      filteringOptions={Object.values(MyJobStatus).map((status) => ({
        name: capitalize(status),
        option: status,
      }))}
      isChecked={(status) => status === filterParams.status}
      setFiltering={(status) => {
        setFilterParams({
          status,
          page: 0,
        });
      }}
      isMobile
    />
  );
}
