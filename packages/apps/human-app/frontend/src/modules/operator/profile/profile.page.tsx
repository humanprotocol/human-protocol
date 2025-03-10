import { useEffect } from 'react';
import { Grid } from '@mui/material';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useGetKeys } from '@/modules/operator/hooks/use-get-keys';
import {
  PageCardError,
  PageCardLoader,
} from '@/shared/components/ui/page-card';
import { getErrorMessageForError } from '@/shared/errors';
import { useGetOperatorStats } from './hooks';
import { OperatorInfo, OperatorStats } from './components';

export function OperatorProfilePage() {
  const isMobile = useIsMobile('lg');
  const {
    data: keysData,
    error: keysError,
    isError: isKeysError,
    isPending: isKeysDataPending,
  } = useGetKeys();

  const {
    data: statsData,
    error: statsError,
    isError: isStatsError,
    isPending: isStatsPending,
    refetch: refetchStats,
  } = useGetOperatorStats();

  useEffect(() => {
    if (keysData?.url) {
      void refetchStats();
    }
  }, [keysData?.url, refetchStats]);

  if (isKeysDataPending || isStatsPending) {
    return <PageCardLoader />;
  }

  if (isKeysError || isStatsError) {
    return (
      <PageCardError
        errorMessage={getErrorMessageForError(keysError ?? statsError)}
      />
    );
  }

  return (
    <Grid container spacing={4}>
      <Grid item xs={isMobile ? 12 : 8}>
        <OperatorInfo keysData={keysData} />
      </Grid>
      <Grid item xs={isMobile ? 12 : 4}>
        <OperatorStats statsData={statsData} />
      </Grid>
    </Grid>
  );
}
