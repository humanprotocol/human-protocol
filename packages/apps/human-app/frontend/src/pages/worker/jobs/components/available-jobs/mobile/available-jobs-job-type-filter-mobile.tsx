/* eslint-disable camelcase --- ... */
import capitalize from 'lodash/capitalize';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';

export function AvailableJobsJobTypeFilterMobile({
  jobTypes,
}: {
  jobTypes: string[];
}) {
  const { setFilterParams, filterParams } = useJobsFilterStore();

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          ...filterParams,
          job_type: undefined,
          page: 0,
        });
      }}
      filteringOptions={jobTypes.map((jobType) => ({
        name: capitalize(jobType),
        option: jobType.toUpperCase(),
      }))}
      isChecked={(option) => option === filterParams.job_type?.toUpperCase()}
      isMobile={false}
      setFiltering={(jobType) => {
        setFilterParams({
          ...filterParams,
          job_type: jobType,
          page: 0,
        });
      }}
    />
  );
}
