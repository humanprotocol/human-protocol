import { Stack, Grid } from '@mui/material';
import { useEffect } from 'react';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Loader } from '@/shared/components/ui/loader';
import { NoRecords } from '@/shared/components/ui/no-records';
import { useGetOraclesNotifications } from '@/modules/worker/hooks/use-get-oracles-notifications';
import { useGetOracles } from '../hooks';
import { OraclesTableItemMobile } from './oracles-table-item-mobile';
import { OraclesTableDesktop } from './oracles-table-desktop';

export function OraclesTable() {
  const isMobile = useIsMobile();
  const { onError } = useGetOraclesNotifications();
  const {
    data: oraclesData,
    isError: isOraclesDataError,
    isPending: isOraclesDataPending,
    error: oraclesDataError,
  } = useGetOracles();

  useEffect(() => {
    if (oraclesDataError) {
      onError(oraclesDataError);
    }
  }, [oraclesDataError, onError]);

  if (isMobile && isOraclesDataPending) {
    return (
      <Grid
        container
        sx={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}
      >
        <Loader />
      </Grid>
    );
  }

  if (isMobile && isOraclesDataError) {
    return <NoRecords />;
  }

  return isMobile ? (
    <Stack flexDirection="column">
      {(oraclesData ?? []).map((oracle) => (
        <OraclesTableItemMobile
          key={`${oracle.address}-${oracle.name}`}
          oracle={oracle}
        />
      ))}
    </Stack>
  ) : (
    <OraclesTableDesktop
      isOraclesDataError={isOraclesDataError}
      isOraclesDataPending={isOraclesDataPending}
      oraclesData={oraclesData ?? []}
    />
  );
}
