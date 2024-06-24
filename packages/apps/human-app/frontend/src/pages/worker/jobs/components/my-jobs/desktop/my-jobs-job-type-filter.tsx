/* eslint-disable camelcase --- ... */
import capitalize from 'lodash/capitalize';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';

export function MyJobsJobTypeFilter({ jobTypes }: { jobTypes: string[] }) {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();

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
        option: jobType,
      }))}
      isChecked={(option) => option === filterParams.job_type}
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
