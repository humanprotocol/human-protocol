import { Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/button';
import { Loader } from '@/shared/components/ui/loader';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { useCombinePages } from '@/shared/hooks';
import { useMyJobsFilterStore, useInfiniteGetMyJobsData } from '../../../hooks';
import { type MyJob } from '../../../schemas';
import { MyJobsCardMobile } from './my-jobs-card-mobile';

export function MyJobsListMobile() {
  const { t } = useTranslation();
  const { filterParams, setPageParams } = useMyJobsFilterStore();
  const { data, isPending, isError, error, fetchNextPage, hasNextPage } =
    useInfiniteGetMyJobsData();

  const allPages = useCombinePages<MyJob>(data);

  return (
    <Stack sx={{ px: 2 }}>
      {isError && (
        <Alert color="error" severity="error">
          {getErrorMessageForError(error)}
        </Alert>
      )}
      {isPending && (
        <Stack sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <Loader size={90} />
        </Stack>
      )}
      {!isPending &&
        !isError &&
        allPages.map((d) => {
          return <MyJobsCardMobile key={d.assignment_id} job={d} />;
        })}
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
