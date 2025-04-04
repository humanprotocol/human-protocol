/* eslint-disable camelcase --- ... */
import { t } from 'i18next';
import { Sorting } from '@/shared/components/ui/table/table-header-menu/sorting';
import { useMyJobsFilterStore } from '../../../hooks';
import { SortDirection, SortField } from '../../../types';

export function MyJobsExpiresAtSort() {
  const { setFilterParams } = useMyJobsFilterStore();

  const sortAscExpiresAt = () => {
    setFilterParams({
      sort_field: SortField.EXPIRES_AT,
      sort: SortDirection.ASC,
    });
  };

  const sortDescExpiresAt = () => {
    setFilterParams({
      sort_field: SortField.EXPIRES_AT,
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
