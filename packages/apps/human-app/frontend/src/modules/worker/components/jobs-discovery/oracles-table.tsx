import { useNavigate } from 'react-router-dom';
import { Stack, Grid } from '@mui/material';
import { useEffect } from 'react';
import type { Oracle } from '@/modules/worker/services/oracles';
import { useGetRegistrationInExchangeOracles } from '@/modules/worker/services/get-registration-in-exchange-oracles';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { OraclesTableDesktop } from '@/modules/worker/components/jobs-discovery/components/oracles-table-desktop';
import { handleOracleNavigation } from '@/modules/worker/components/jobs-discovery/helpers/handle-oracle-navigation';
import { Loader } from '@/shared/components/ui/loader';
import { NoRecords } from '@/shared/components/ui/no-records';
import { OraclesTableItemMobile } from '@/modules/worker/components/jobs-discovery/components/oracles-table-item-mobile';
import { useGetOraclesNotifications } from '@/modules/worker/hooks/use-get-oracles-notifications';
import { useGetOracles } from '@/modules/worker/services/oracles';

export function OraclesTable() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuthenticatedUser();
  const { data: registrationInExchangeOraclesResult } =
    useGetRegistrationInExchangeOracles();
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

  const selectOracle = (oracle: Oracle) => {
    handleOracleNavigation({
      oracle,
      siteKey: user.site_key,
      navigate,
      registrationData: registrationInExchangeOraclesResult,
    });
  };

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
          selectOracle={selectOracle}
        />
      ))}
    </Stack>
  ) : (
    <OraclesTableDesktop
      isOraclesDataError={isOraclesDataError}
      isOraclesDataPending={isOraclesDataPending}
      selectOracle={selectOracle}
      oraclesData={oraclesData ?? []}
    />
  );
}
