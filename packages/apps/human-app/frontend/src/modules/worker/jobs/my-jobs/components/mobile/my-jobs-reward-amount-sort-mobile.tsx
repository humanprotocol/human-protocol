/* eslint-disable camelcase */
import Typography from '@mui/material/Typography';
import { t } from 'i18next';
import { useColorMode } from '@/shared/contexts/color-mode';
import { Sorting } from '../../../components';
import { useMyJobsFilterStore } from '../../../hooks';

export function MyJobsRewardAmountSortMobile() {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();
  const { colorPalette } = useColorMode();

  return (
    <Sorting
      label={
        <Typography color={colorPalette.text.secondary} variant="body2">
          {t('worker.jobs.rewardAmount')}
        </Typography>
      }
      fromHighestSelected={
        filterParams.sort_field === 'reward_amount' &&
        filterParams.sort === 'desc'
      }
      sortFromHighest={() => {
        setFilterParams({
          ...filterParams,
          sort: 'desc',
          sort_field: 'reward_amount',
        });
      }}
      fromLowestSelected={
        filterParams.sort_field === 'reward_amount' &&
        filterParams.sort === 'asc'
      }
      sortFromLowest={() => {
        setFilterParams({
          ...filterParams,
          sort: 'asc',
          sort_field: 'reward_amount',
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
