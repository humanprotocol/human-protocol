/* eslint-disable camelcase --- ... */
import { useTranslation } from 'react-i18next';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { JOB_TYPES } from '@/shared/consts';

export function AvailableJobsJobTypeFilterMobile() {
  const { t } = useTranslation();
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
      filteringOptions={JOB_TYPES.map((jobType) => ({
        name: t(`jobTypeLabels.${jobType}`),
        option: jobType,
      }))}
      isChecked={(option) => option === filterParams.job_type}
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
