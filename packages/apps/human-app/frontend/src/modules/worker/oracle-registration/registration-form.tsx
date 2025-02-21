import { Box, Stack } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { HCaptchaForm } from '@/shared/components/hcaptcha/h-captcha-form';
import {
  registrationInExchangeOracleDtoSchema,
  type RegistrationInExchangeOracleDto,
} from './sevices';
import { useOracleRegistrationFlow } from './hooks';

function useRegistrationForm(address: string | undefined) {
  return useForm<RegistrationInExchangeOracleDto>({
    defaultValues: {
      // eslint-disable-next-line camelcase
      oracle_address: address,
      // eslint-disable-next-line camelcase
      h_captcha_token: '',
    },
    resolver: zodResolver(registrationInExchangeOracleDtoSchema),
  });
}

export function RegistrationForm({
  address,
  oracleInstructions,
}: Readonly<{
  address: string | undefined;
  oracleInstructions: string | URL | null | undefined;
}>) {
  const { t } = useTranslation();
  const methods = useRegistrationForm(address);

  const {
    hasViewedInstructions,
    handleInstructionsView,
    handleRegistration,
    isRegistrationPending: isLoading,
    registrationError: error,
  } = useOracleRegistrationFlow(address, oracleInstructions);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void methods.handleSubmit(handleRegistration)(event);
  };

  return (
    <>
      <Button onClick={handleInstructionsView} fullWidth variant="contained">
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
