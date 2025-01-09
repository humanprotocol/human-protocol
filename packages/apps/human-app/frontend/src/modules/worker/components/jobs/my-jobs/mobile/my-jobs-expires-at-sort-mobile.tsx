/* eslint-disable camelcase */
import Typography from '@mui/material/Typography';
import { t } from 'i18next';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { useMyJobsFilterStore } from '@/modules/worker/hooks/use-my-jobs-filter-store';
import { Sorting } from '@/modules/worker/components/jobs/sorting';

export function MyJobsExpiresAtSortMobile() {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();
  const { colorPalette } = useColorMode();

  return (
    <Sorting
      label={
        <Typography color={colorPalette.text.secondary} variant="body2">
          {t('worker.jobs.expiresAt')}
        </Typography>
      }
      fromHighestSelected={
        filterParams.sort_field === 'expires_at' && filterParams.sort === 'desc'
      }
      sortFromHighest={() => {
        setFilterParams({
          ...filterParams,
          sort: 'desc',
          sort_field: 'expires_at',
        });
      }}
      fromLowestSelected={
        filterParams.sort_field === 'expires_at' && filterParams.sort === 'asc'
      }
      sortFromLowest={() => {
        setFilterParams({
          ...filterParams,
          sort: 'asc',
          sort_field: 'expires_at',
        });
      }}
      clear={() => {
        setFilterParams({
          ...filterParams,
          sort: undefined,
          sort_field: undefined,
        });
      }}
    />
  );
}
