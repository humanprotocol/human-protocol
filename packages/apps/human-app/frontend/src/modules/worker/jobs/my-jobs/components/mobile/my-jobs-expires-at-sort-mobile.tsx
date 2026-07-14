import Typography from '@mui/material/Typography';
import { t } from 'i18next';
import { useColorMode } from '@/shared/contexts/color-mode';
import { Sorting } from '../../../components';
import { useMyJobsFilterStore } from '../../../hooks';
import { SortDirection, SortField } from '../../../types';

export function MyJobsExpiresAtSortMobile() {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();
  const { colorPalette } = useColorMode();

  return (
    <Sorting
      label={
        <Typography variant="body2" sx={{ color: colorPalette.text.secondary }}>
          {t('worker.jobs.expiresAt')}
        </Typography>
      }
      fromHighestSelected={
        filterParams.sort_field === SortField.EXPIRES_AT &&
        filterParams.sort === SortDirection.DESC
      }
      sortFromHighest={() => {
        setFilterParams({
          sort: SortDirection.DESC,
          sort_field: SortField.EXPIRES_AT,
        });
      }}
      fromLowestSelected={
        filterParams.sort_field === SortField.EXPIRES_AT &&
        filterParams.sort === SortDirection.ASC
      }
      sortFromLowest={() => {
        setFilterParams({
          sort: SortDirection.ASC,
          sort_field: SortField.EXPIRES_AT,
        });
      }}
      clear={() => {
        setFilterParams({
          sort: undefined,
          sort_field: undefined,
        });
      }}
    />
  );
}
