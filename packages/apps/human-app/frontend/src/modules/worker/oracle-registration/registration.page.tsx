import { Box, Grid, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { RegistrationForm } from '@/modules/worker/oracle-registration/registration-form';
import { Loader } from '@/shared/components/ui/loader';
import { routerPaths } from '@/router/router-paths';
import { useGetOracles } from '../hooks';
import { useIsAlreadyRegistered } from './hooks';

const styles = {
  height: '100%',
  minHeight: '70vh',
  width: '100%',
  boxShadow: 'none',
  padding: '40px',
  borderRadius: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

function isAddress(address: string | undefined): address is string {
  return address !== undefined && address.length > 0;
}

export function RegistrationPage() {
  const { t } = useTranslation();
  const { address: oracleAddress } = useParams<{ address: string }>();
  const { data, isLoading } = useGetOracles();
  const { registered, isPending } = useIsAlreadyRegistered(oracleAddress);

  if (isLoading || isPending) {
    return (
      <Paper sx={styles}>
        <Loader />
      </Paper>
    );
  }

  const oracleData = data?.find((o) => o.address === oracleAddress);

  if (oracleData === undefined || !isAddress(oracleAddress)) {
    return <Navigate to={routerPaths.worker.jobsDiscovery} />;
  }

  if (registered || !oracleData.registrationNeeded) {
    return (
      <Navigate
        to={`${routerPaths.worker.jobs}/${oracleAddress}`}
        state={oracleAddress}
      />
    );
  }

  return (
    <Grid container sx={{ alignItems: 'center', justifyContent: 'center' }}>
      <Grid size={12}>
        <Paper sx={styles}>
          <Stack sx={{ gap: 2, maxWidth: '350px' }}>
            <Box>
              {t('worker.registrationInExchangeOracle.requiredMessage')}
            </Box>
            <RegistrationForm
              address={oracleAddress}
              oracleInstructions={oracleData.registrationInstructions}
            />
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
