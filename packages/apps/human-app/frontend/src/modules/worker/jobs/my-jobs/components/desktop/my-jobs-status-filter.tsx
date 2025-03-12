import capitalize from 'lodash/capitalize';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useIsMobile } from '@/shared/hooks';
import { useMyJobsFilterStore } from '../../../hooks';
import { MyJobStatus } from '../../../types';

export function MyJobsStatusFilter() {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();
  const isMobile = useIsMobile();

  return (
    <Filtering
      clear={() => {
        setFilterParams({
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
          status,
        });
      }}
      isMobile={isMobile}
    />
  );
}
