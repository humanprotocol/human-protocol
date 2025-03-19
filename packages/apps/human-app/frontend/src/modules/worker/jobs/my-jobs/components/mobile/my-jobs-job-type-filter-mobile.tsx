/* eslint-disable camelcase --- ... */
import { useTranslation } from 'react-i18next';
import { Filtering } from '@/shared/components/ui/table/table-header-menu.tsx/filtering';
import { JOB_TYPES } from '@/shared/consts';
import { useMyJobsFilterStore } from '../../../hooks';

export function MyJobsJobTypeFilterMobile() {
  const { t } = useTranslation();
  const { setFilterParams, filterParams } = useMyJobsFilterStore();

  return (
    <Filtering
      clear={() => {
        setFilterParams({
          job_type: undefined,
          page: 0,
        });
      }}
      filteringOptions={JOB_TYPES.map((jobType) => ({
        name: t(`jobTypeLabels.${jobType}`),
        option: jobType,
      }))}
      isChecked={(option) => option === filterParams.job_type}
      setFiltering={(jobType) => {
        setFilterParams({
          job_type: jobType,
          page: 0,
        });
      }}
    />
  );
}
