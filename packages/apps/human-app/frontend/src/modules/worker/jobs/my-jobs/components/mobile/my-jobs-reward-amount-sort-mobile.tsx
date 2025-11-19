import Typography from '@mui/material/Typography';
import { t } from 'i18next';
import { useColorMode } from '@/shared/contexts/color-mode';
import { Sorting } from '../../../components';
import { useMyJobsFilterStore } from '../../../hooks';
import { SortDirection, SortField } from '../../../types';

export function MyJobsRewardAmountSortMobile() {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();
  const { colorPalette } = useColorMode();
  const isRewardAmountSortSelected =
    filterParams.sort_field === SortField.REWARD_AMOUNT;

  return (
    <Sorting
      label={
        <Typography color={colorPalette.text.secondary} variant="body2">
          {t('worker.jobs.rewardAmount')}
        </Typography>
      }
      fromHighestSelected={
        isRewardAmountSortSelected && filterParams.sort === SortDirection.DESC
      }
      sortFromHighest={() => {
        setFilterParams({
          sort: SortDirection.DESC,
          sort_field: SortField.REWARD_AMOUNT,
        });
      }}
      fromLowestSelected={
        isRewardAmountSortSelected && filterParams.sort === SortDirection.ASC
      }
      sortFromLowest={() => {
        setFilterParams({
          sort: SortDirection.ASC,
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
