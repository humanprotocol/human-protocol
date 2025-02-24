import { Box, Grid, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { RegistrationForm } from '@/modules/worker/oracle-registration/registration-form';
import { Loader } from '@/shared/components/ui/loader';
import { useGetOracles } from '../services/oracles';
import { useOracleNavigation } from './hooks/use-oracle-navigation';
import { useIsAlreadyRegistered } from './hooks';

function isAddress(address: string | undefined): address is string {
  return address !== undefined && address.length > 0;
}

export function RegistrationPage() {
  const { t } = useTranslation();
  const { address } = useParams<{ address: string }>();
  const { data, isLoading } = useGetOracles();
  const isAlreadyRegistered = useIsAlreadyRegistered(address);
  const { navigateToJobs, navigateToDiscovery } = useOracleNavigation(address);

  const oracleData = data?.find((o) => o.address === address);

  useEffect(() => {
    if (oracleData === undefined || !isAddress(address)) {
      navigateToDiscovery();
    }
  }, [oracleData, address, navigateToDiscovery]);

  useEffect(() => {
    if (isAlreadyRegistered) {
      navigateToJobs();
    }
  }, [isAlreadyRegistered, navigateToJobs]);

  if (!isAddress(address)) {
    return null;
  }

  return (
    <Grid alignItems="center" container justifyContent="center">
      <Grid item xs={12}>
        <Paper
          sx={{
            height: '100%',
            minHeight: '70vh',
            width: '100%',
            boxShadow: 'none',
            padding: '40px',
            borderRadius: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Stack maxWidth="350px" spacing={2}>
            {isLoading ? (
              <Loader />
            ) : (
              <>
                <Box>
                  {t('worker.registrationInExchangeOracle.requiredMessage')}
                </Box>
                <RegistrationForm
                  address={address}
                  oracleInstructions={oracleData?.registrationInstructions}
                />
              </>
            )}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
