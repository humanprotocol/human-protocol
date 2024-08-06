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
    });
  };

  const sortDescRewardAmount = () => {
    setFilterParams({
      ...filterParams,
      sort_field: 'reward_amount',
      sort: 'DESC',
    });
  };

  return (
    <Sorting
      clear={() => {
        setFilterParams({
          ...filterParams,
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
