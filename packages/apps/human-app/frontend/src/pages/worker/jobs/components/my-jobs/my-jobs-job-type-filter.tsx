/* eslint-disable camelcase --- ... */
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { capitalizeFirstLetters } from '@/shared/helpers/capitalize-first-letter';

export function MyJobsJobTypeFilter({ jobTypes }: { jobTypes: string[] }) {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          ...filterParams,
          job_type: undefined,
        });
      }}
      filteringOptions={jobTypes.map((jobType) => ({
        name: capitalizeFirstLetters(jobType),
        option: jobType,
      }))}
      isChecked={(option) => option === filterParams.job_type}
      setFiltering={(jobType) => {
        setFilterParams({
          ...filterParams,
          job_type: jobType,
        });
      }}
    />
  );
}
