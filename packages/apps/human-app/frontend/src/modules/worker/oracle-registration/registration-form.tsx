import { type SubmitEvent } from 'react';
import { Stack, Typography } from '@mui/material';
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
}: {
  address: string;
  oracleInstructions: string | URL | null | undefined;
}) {
  const { t } = useTranslation();

  const { hasViewedInstructions, handleInstructionsView } =
    useOracleInstructions(oracleInstructions);

  const {
    mutate: registerInOracle,
    isPending: isLoading,
    error,
  } = useExchangeOracleRegistrationMutation();

  const methods = useForm({
    defaultValues: {
      h_captcha_token: '',
    },
    resolver: zodResolver(oracleRegistrationFormSchema),
  });

  const handleSubmit = (event: SubmitEvent) => {
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
      <Button variant="contained" fullWidth onClick={handleInstructionsView}>
        {t('worker.registrationInExchangeOracle.instructionsButton')}
      </Button>
      <Typography variant="body4" sx={{ color: 'text.auxiliary100' }}>
        {t('worker.registrationInExchangeOracle.completeMessage')}
      </Typography>
      <FormProvider {...methods}>
        <Stack
          component="form"
          sx={{
            alignItems: { xs: 'center', md: 'flex-start' },
            gap: 2,
            width: '100%',
          }}
          onSubmit={handleSubmit}
        >
          <HCaptchaForm error={error} name="h_captcha_token" />
          <Button
            type="submit"
            variant="contained"
            color="accent"
            disabled={disabled}
            fullWidth
            loading={isLoading}
          >
            {t('worker.registrationInExchangeOracle.completeButton')}
          </Button>
        </Stack>
      </FormProvider>
    </>
  );
}
