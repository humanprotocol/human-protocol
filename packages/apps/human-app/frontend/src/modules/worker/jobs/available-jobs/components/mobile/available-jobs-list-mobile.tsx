import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack } from '@mui/material';

import { Button } from '@/shared/components/ui/button';
import { Alert } from '@/shared/components/ui/alert';
import { Loader } from '@/shared/components/ui/loader';
import { getErrorMessageForError } from '@/shared/errors';
import { useCombinePages } from '@/shared/hooks';
import { useJobsFilterStore } from '../../../hooks';
import { useInifiniteGetAvailableJobsData } from '../../hooks/use-get-available-jobs-data';
import { type AvailableJob } from '../../../types';
import { AvailableJobsCard } from './available-jobs-card';

export function AvailableJobsListMobile({
  oracleAddress,
}: {
  oracleAddress: string;
}) {
  const { t } = useTranslation();
  const { filterParams, setPageParams, resetFilterParams } =
    useJobsFilterStore();
  const { data, isPending, isError, error, fetchNextPage, hasNextPage } =
    useInifiniteGetAvailableJobsData({ oracleAddress });

  const allPages = useCombinePages<AvailableJob>(data);

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
  }, [resetFilterParams]);

  return (
    <Stack sx={{ px: 2 }}>
      {isError && (
        <Alert color="error" severity="error">
          {getErrorMessageForError(error)}
        </Alert>
      )}
      {isPending && (
        <Stack sx={{ alignItems: 'center', justifyContent: 'center', mt: 4 }}>
          <Loader size={90} />
        </Stack>
      )}
      {allPages.map((d) => (
        <AvailableJobsCard
          key={`${d.escrow_address}-${d.chain_id}-${d.job_type}`}
          job={d}
        />
      ))}
      {hasNextPage && (
        <Button
          variant="outlined"
          onClick={() => {
            setPageParams(filterParams.page + 1, filterParams.page_size);
            void fetchNextPage();
          }}
        >
          {t('worker.jobs.next')}
        </Button>
      )}
    </Stack>
  );
}
