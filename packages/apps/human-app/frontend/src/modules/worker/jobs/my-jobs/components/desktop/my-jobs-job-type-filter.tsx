/* eslint-disable camelcase --- ... */
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { JOB_TYPES } from '@/shared/consts';
import { useIsMobile } from '@/shared/hooks';
import { useMyJobsFilterStore } from '../../../hooks';

export function MyJobsJobTypeFilter() {
  const { t } = useTranslation();
  const { setFilterParams, filterParams } = useMyJobsFilterStore();
  const filteringOptions = useMemo(
    () =>
      JOB_TYPES.map((jobType) => ({
        name: t(`jobTypeLabels.${jobType}`),
        option: jobType,
      })),
    [t]
  );
  const isMobile = useIsMobile();

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          job_type: undefined,
        });
      }}
      filteringOptions={filteringOptions}
      isChecked={(option) => option === filterParams.job_type}
      setFiltering={(jobType) => {
        setFilterParams({
          job_type: jobType,
        });
      }}
      isMobile={isMobile}
    />
  );
}
