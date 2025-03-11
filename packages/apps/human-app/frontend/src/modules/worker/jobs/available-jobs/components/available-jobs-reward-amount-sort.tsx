/* eslint-disable camelcase --- ... */
import { t } from 'i18next';
import { Sorting } from '@/shared/components/ui/table/table-header-menu.tsx/sorting';
import { useJobsFilterStore } from '../../hooks';
import { SortDirection, SortField } from '../../types';

export function AvailableJobsRewardAmountSort() {
  const { setFilterParams } = useJobsFilterStore();

  const sortAscRewardAmount = () => {
    setFilterParams({
      sort_field: SortField.REWARD_AMOUNT,
      sort: SortDirection.ASC,
    });
  };

  const sortDescRewardAmount = () => {
    setFilterParams({
      sort_field: SortField.REWARD_AMOUNT,
      sort: SortDirection.DESC,
    });
  };

  return (
    <Sorting
      clear={() => {
        setFilterParams({
          sort_field: undefined,
          sort: undefined,
        });
      }}
      sortingOptions={[
        {
          label: t('worker.jobs.sortDirection.fromHighest'),
          sortCallback: sortDescRewardAmount,
        },
        {
          label: t('worker.jobs.sortDirection.fromLowest'),
          sortCallback: sortAscRewardAmount,
        },
      ]}
    />
  );
}
