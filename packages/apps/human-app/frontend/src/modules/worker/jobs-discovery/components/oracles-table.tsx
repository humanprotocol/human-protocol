import { useNavigate } from 'react-router-dom';
import { Stack, Grid } from '@mui/material';
import { useEffect } from 'react';
import { useGetRegistrationInExchangeOracles } from '@/modules/worker/services/get-registration-in-exchange-oracles';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { Loader } from '@/shared/components/ui/loader';
import { NoRecords } from '@/shared/components/ui/no-records';
import { useGetOraclesNotifications } from '@/modules/worker/hooks/use-get-oracles-notifications';
import { handleOracleNavigation } from '../helpers';
import { type Oracle, useGetOracles } from '../hooks';
import { OraclesTableItemMobile } from './oracles-table-item-mobile';
import { OraclesTableDesktop } from './oracles-table-desktop';

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
