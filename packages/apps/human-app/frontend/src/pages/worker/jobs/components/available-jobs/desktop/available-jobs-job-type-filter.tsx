/* eslint-disable camelcase --- ... */
import capitalize from 'lodash/capitalize';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { stringToUpperSnakeCase } from '@/shared/helpers/string-to-upper-snake-case';

export function AvailableJobsJobTypeFilter({
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
