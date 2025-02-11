/* eslint-disable camelcase --- ... */
import { useTranslation } from 'react-i18next';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import { JOB_TYPES } from '@/shared/consts';

export function AvailableJobsJobTypeFilter() {
  const { t } = useTranslation();
  const { setFilterParams, filterParams } = useJobsFilterStore();

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
