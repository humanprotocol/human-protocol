/* eslint-disable camelcase --- ... */
import { t } from 'i18next';
import { Sorting } from '@/components/ui/table/table-header-menu.tsx/sorting';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';

export function AvailableJobsRewardAmountSort() {
  const { setFilterParams, filterParams } = useJobsFilterStore();

  const sortAscRewardAmount = () => {
    setFilterParams({
      ...filterParams,
      sort_field: 'reward_amount',
      sort: 'ASC',
      page: 0,
    });
  };

  const sortDescRewardAmount = () => {
    setFilterParams({
      ...filterParams,
      sort_field: 'reward_amount',
      sort: 'DESC',
      page: 0,
    });
  };

  return (
    <Sorting
      clear={() => {
        setFilterParams({
          ...filterParams,
          sort_field: undefined,
          sort: undefined,
          page: 0,
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
