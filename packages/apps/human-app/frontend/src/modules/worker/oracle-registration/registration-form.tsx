import { Box, Stack } from '@mui/material';
import { FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { HCaptchaForm } from '@/shared/components/hcaptcha/h-captcha-form';
import { useOracleRegistrationFlow, useRegistrationForm } from './hooks';

export function RegistrationForm() {
  const { t } = useTranslation();
  const methods = useRegistrationForm();
  const {
    hasViewedInstructions,
    handleInstructionsView: onInstructionsClick,
    handleRegistration: onSubmit,
    isRegistrationPending: isLoading,
    registrationError: error,
  } = useOracleRegistrationFlow();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void methods.handleSubmit(onSubmit)(event);
  };

  return (
    <>
      <Button onClick={onInstructionsClick} fullWidth variant="contained">
        {t('worker.registrationInExchangeOracle.instructionsButton')}
      </Button>
      <Box>{t('worker.registrationInExchangeOracle.completeMessage')}</Box>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit}>
          <Stack alignItems="center" spacing={2}>
            <HCaptchaForm error={error} name="h_captcha_token" />
            <Button
              disabled={!hasViewedInstructions}
              fullWidth
              loading={isLoading}
              type="submit"
              variant="contained"
            >
              {t('worker.registrationInExchangeOracle.completeButton')}
            </Button>
          </Stack>
        </form>
      </FormProvider>
    </>
  );
}
