/* eslint-disable camelcase */
import { Box, Stack } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { HCaptchaForm } from '@/shared/components/hcaptcha';
import { useOracleInstructions } from './hooks/use-oracle-instructions';
import { useExchangeOracleRegistrationMutation } from './hooks/use-exchange-oracle-registration-mutation';
import {
  oracleRegistrationFormSchema,
  type OracleRegistrationFormValues,
} from './schema';

export function RegistrationForm({
  address,
  oracleInstructions,
}: Readonly<{
  address: string;
  oracleInstructions: string | URL | null | undefined;
}>) {
  const { t } = useTranslation();

  const { hasViewedInstructions, handleInstructionsView } =
    useOracleInstructions(oracleInstructions);

  const {
    mutate: registerInOracle,
    isPending: isLoading,
    error,
  } = useExchangeOracleRegistrationMutation();

  const methods = useForm<OracleRegistrationFormValues>({
    defaultValues: {
      h_captcha_token: '',
    },
    resolver: zodResolver(oracleRegistrationFormSchema),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void methods.handleSubmit((formData: OracleRegistrationFormValues) => {
      registerInOracle({
        h_captcha_token: formData.h_captcha_token,
        oracle_address: address,
      });
    })(event);
  };

  const disabled = !hasViewedInstructions || isLoading;

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
              disabled={disabled}
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
