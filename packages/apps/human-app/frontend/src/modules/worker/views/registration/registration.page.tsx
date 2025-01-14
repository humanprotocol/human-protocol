import { Box, Grid, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useRegistrationPageLogic } from '@/modules/worker/hooks/use-registration-page-logic';
import { RegistrationForm } from '@/modules/worker/components/registration/registration-form';

export function RegistrationPage() {
  const { t } = useTranslation();
  const {
    hasClickedRegistrationLink,
    handleInstructionsLinkClick,
    handleRegistrationComplete,
    isRegistrationInExchangeOraclePending,
    registrationInExchangeOracleError,
  } = useRegistrationPageLogic();

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
              hasClickedRegistrationLink={hasClickedRegistrationLink}
              isLoading={isRegistrationInExchangeOraclePending}
              error={registrationInExchangeOracleError}
              onInstructionsClick={handleInstructionsLinkClick}
              onSubmit={handleRegistrationComplete}
            />
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
