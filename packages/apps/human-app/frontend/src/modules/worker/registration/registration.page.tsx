import { Box, Grid, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { RegistrationForm } from '@/modules/worker/registration/registration-form';
import { useOracleRegistrationFlow } from './hooks';

export function RegistrationPage() {
  const { t } = useTranslation();
  const {
    hasViewedInstructions,
    handleInstructionsView,
    handleRegistration,
    isRegistrationPending,
    registrationError,
  } = useOracleRegistrationFlow();

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
            <Box>
              {t('worker.registrationInExchangeOracle.requiredMessage')}
            </Box>
            <RegistrationForm
              hasViewedInstructions={hasViewedInstructions}
              isLoading={isRegistrationPending}
              error={registrationError}
              onInstructionsClick={handleInstructionsView}
              onSubmit={handleRegistration}
            />
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
