/* eslint-disable camelcase */
import { t } from 'i18next';
import Typography from '@mui/material/Typography';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useJobsFilterStore } from '../../../hooks';
import { Sorting } from '../../../components';
import { SortField } from '../../../types';

export function AvailableJobsRewardAmountSortMobile() {
  const { setFilterParams, filterParams } = useJobsFilterStore();
  const { colorPalette } = useColorMode();

  return (
    <Sorting
      label={
        <Typography color={colorPalette.text.secondary} variant="body2">
          {t('worker.jobs.rewardAmount')}
        </Typography>
      }
      fromHighestSelected={
        filterParams.sort_field === SortField.REWARD_AMOUNT &&
        filterParams.sort === 'desc'
      }
      sortFromHighest={() => {
        setFilterParams({
          sort: 'desc',
          sort_field: SortField.REWARD_AMOUNT,
        });
      }}
      fromLowestSelected={
        filterParams.sort_field === SortField.REWARD_AMOUNT &&
        filterParams.sort === 'asc'
      }
      sortFromLowest={() => {
        setFilterParams({
          sort: 'asc',
          sort_field: SortField.REWARD_AMOUNT,
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
