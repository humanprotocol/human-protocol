/* eslint-disable camelcase --- ... */
import { t } from 'i18next';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { Sorting } from '@/components/ui/table/table-header-menu.tsx/sorting';

export function MyJobsExpiresAtSort() {
  const { setFilterParams, filterParams } = useMyJobsFilterStore();

  const sortAscExpiresAt = () => {
    setFilterParams({
      ...filterParams,
      sort_field: 'expires_at',
      sort: 'ASC',
    });
  };

  const sortDescExpiresAt = () => {
    setFilterParams({
      ...filterParams,
      sort_field: 'expires_at',
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
          label: t('worker.jobs.sortDirection.closestToNow'),
          sortCallback: sortAscExpiresAt,
        },
        {
          label: t('worker.jobs.sortDirection.furthestToNow'),
          sortCallback: sortDescExpiresAt,
        },
      ]}
    />
  );
}
