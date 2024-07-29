/* eslint-disable camelcase --- ... */
import capitalize from 'lodash/capitalize';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { stringToUpperSnakeCase } from '@/shared/helpers/string-to-upper-snake-case';

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
        name: capitalize(jobType),
        option: jobType,
      }))}
      isChecked={(option) =>
        stringToUpperSnakeCase(option) === filterParams.job_type
      }
      setFiltering={(jobType) => {
        setFilterParams({
          ...filterParams,
          job_type: stringToUpperSnakeCase(jobType),
        });
      }}
    />
  );
}
