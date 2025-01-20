/* eslint-disable camelcase --- ... */
import { useTranslation } from 'react-i18next';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { JOB_TYPES } from '@/shared/consts';
import { useFilterUpdates } from '@/modules/worker/hooks/use-filter-updates';

export function AvailableJobsJobTypeFilter({ isMobile = false }) {
  const { t } = useTranslation();
  const { filterParams, updateFilterParams } = useFilterUpdates({ isMobile });

  const filteringOptions = JOB_TYPES.map((jobType) => ({
    name: t(`jobTypeLabels.${jobType}`),
    option: jobType,
  }));

  const handleClear = () => {
    updateFilterParams({ job_type: undefined });
  };

  const handleFilterChange = (jobType: string) => {
    updateFilterParams({ job_type: jobType });
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
