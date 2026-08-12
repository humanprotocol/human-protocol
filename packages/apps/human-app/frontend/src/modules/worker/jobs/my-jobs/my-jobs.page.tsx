import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Button } from '@/shared/components/ui/button';
import { MyJobsListMobile } from './components/mobile/my-jobs-list-mobile';
import { MyJobsTable } from './components/desktop/my-jobs-table';
import { useRefreshJobsMutation } from './hooks';
import { StatusFilter } from './components/desktop/status-filter';
import { MyJobsFilters } from './components/desktop/my-jobs-filters';
import { useMyJobsFilterStore } from '../hooks';
import { JobsSwitcherMobile } from '@/router/components/layout/protected/jobs-switcher-mobile';

export function MyJobsPage() {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const {
    filterParams: { oracle_address },
    resetFilterParams,
  } = useMyJobsFilterStore();

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
  }, [resetFilterParams]);

  const { mutate: refreshTasksMutation, isPending: isRefreshPending } =
    useRefreshJobsMutation();

  return (
    <Stack>
      {isMobile && (
        <Stack sx={{ width: '100%', mb: 2.5, px: 2 }}>
          <JobsSwitcherMobile />
        </Stack>
      )}
      <Stack
        sx={{
          justifyContent: 'center',
          p: { xs: 0, md: 4 },
          mx: { xs: 2, md: 0 },
          borderBottom: {
            xs: 'none',
            md: (theme) => `1px solid ${theme.palette.border.main}`,
          },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t('worker.jobs.myJobs')}
        </Typography>
      </Stack>
      <Stack sx={{ gap: { xs: 2.5, md: 4 }, px: 0, py: 4 }}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, md: 4 },
          }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
            {!isMobile && <StatusFilter />}
            <MyJobsFilters />
          </Stack>
          <Button
            variant="outlined"
            size="small"
            loading={isRefreshPending}
            disabled={!oracle_address}
            onClick={() =>
              refreshTasksMutation({ oracle_address: oracle_address ?? '' })
            }
          >
            {t('worker.jobs.refresh')}
            <RefreshIcon sx={{ ml: 1 }} />
          </Button>
        </Stack>
        {isMobile ? <MyJobsListMobile /> : <MyJobsTable />}
      </Stack>
    </Stack>
  );
}
