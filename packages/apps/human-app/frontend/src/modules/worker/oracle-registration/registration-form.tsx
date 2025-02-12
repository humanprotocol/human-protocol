import { Box, Stack } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { HCaptchaForm } from '@/shared/components/hcaptcha/h-captcha-form';
import {
  registrationInExchangeOracleDtoSchema,
  type RegistrationInExchangeOracleDto,
} from './sevices';
import { useOracleRegistrationFlow } from './hooks';

function useRegistrationForm() {
  const { address: oracleAddress } = useParams<{ address: string }>();

  return useForm<RegistrationInExchangeOracleDto>({
    defaultValues: {
      // eslint-disable-next-line camelcase
      oracle_address: oracleAddress,
      // eslint-disable-next-line camelcase
      h_captcha_token: '',
    },
    resolver: zodResolver(registrationInExchangeOracleDtoSchema),
  });
}

export function RegistrationForm() {
  const { t } = useTranslation();
  const methods = useRegistrationForm();
  const {
    hasViewedInstructions,
    handleInstructionsView,
    handleRegistration,
    isRegistrationPending: isLoading,
    registrationError: error,
  } = useOracleRegistrationFlow();

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
