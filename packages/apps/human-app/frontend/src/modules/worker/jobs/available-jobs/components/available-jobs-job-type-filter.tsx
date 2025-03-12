/* eslint-disable camelcase --- ... */
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { JOB_TYPES } from '@/shared/consts';
import { useJobsFilterStore } from '../../hooks';

export function AvailableJobsJobTypeFilter({ isMobile = false }) {
  const { t } = useTranslation();
  const { setFilterParams, filterParams } = useJobsFilterStore();

  const filteringOptions = useMemo(
    () =>
      JOB_TYPES.map((jobType) => ({
        name: t(`jobTypeLabels.${jobType}`),
        option: jobType,
      })),
    [t]
  );

  const handleClear = () => {
    setFilterParams({ job_type: undefined });
  };

  const handleFilterChange = (jobType: string) => {
    setFilterParams({ job_type: jobType });
  };

  return (
    <Filtering
      clear={handleClear}
      filteringOptions={filteringOptions}
      isChecked={(option) => option === filterParams.job_type}
      isMobile={isMobile}
      setFiltering={handleFilterChange}
    />
  );
}
