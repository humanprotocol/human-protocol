/* eslint-disable camelcase --- ... */
import { useTranslation } from 'react-i18next';
import { useMyJobsFilterStore } from '@/modules/worker/hooks/use-my-jobs-filter-store';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { JOB_TYPES } from '@/shared/consts';

export function MyJobsJobTypeFilter() {
  const { t } = useTranslation();
  const { setFilterParams, filterParams } = useMyJobsFilterStore();

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          ...filterParams,
          job_type: undefined,
        });
      }}
      filteringOptions={JOB_TYPES.map((jobType) => ({
        name: t(`jobTypeLabels.${jobType}`),
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
