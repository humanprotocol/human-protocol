/* eslint-disable camelcase --- ... */
import { useTranslation } from 'react-i18next';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import { JOB_TYPES } from '@/shared/consts';

export function AvailableJobsJobTypeFilter({ isMobile = false }) {
  const { t } = useTranslation();
  const { setFilterParams, filterParams } = useJobsFilterStore();

  const updateFilterParams = (updates: Partial<typeof filterParams>) => {
    const baseUpdate = {
      ...filterParams,
      ...updates,
    };

    if (!isMobile) {
      baseUpdate.page = 0;
    }

    setFilterParams(baseUpdate);
  };

  return (
    <Filtering
      clear={() => {
        updateFilterParams({ job_type: undefined });
      }}
      filteringOptions={JOB_TYPES.map((jobType) => ({
        name: t(`jobTypeLabels.${jobType}`),
        option: jobType,
      }))}
      isChecked={(option) => option === filterParams.job_type}
      isMobile={isMobile}
      setFiltering={(jobType) => {
        updateFilterParams({ job_type: jobType });
      }}
    />
  );
}
