import React, { useState } from 'react';
import { Box, Grid, Link, Paper, Stack } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormCaptcha } from '@/components/h-captcha';
import { Button } from '@/components/ui/button';
import { useUserRegistrationMutation } from '@/api/services/worker/user-register';
import { useRegisteredOracles } from '@/contexts/registered-oracles';
import type { OracleSuccessResponse } from '@/api/services/worker/oracles';

interface RegistrationStepProps {
  oracleData: OracleSuccessResponse;
  onRegistrationComplete: () => void;
}

export function RegistrationStep({
  oracleData,
  onRegistrationComplete,
}: RegistrationStepProps) {
  const { t } = useTranslation();
  const [hasClickedRegistrationLink, setHasClickedRegistrationLink] =
    useState(false);
  const methods = useForm();

  const { registeredOracles, setRegisteredOracles } = useRegisteredOracles();

  const {
    mutate: userRegistrationMutate,
    isPending: isUserRegistrationPending,
    error: userRegistrationError,
  } = useUserRegistrationMutation();

  const handleLinkClick = () => {
    setHasClickedRegistrationLink(true);
  };

  const handleRegistrationComplete = () => {
    userRegistrationMutate(oracleData.address, {
      onSuccess(data) {
        setRegisteredOracles(
          registeredOracles?.concat([
            (data as { oracle_address: string }).oracle_address,
          ])
        );
        onRegistrationComplete(); // Call the completion callback
      },
    });
  };

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
            <Box>{t('worker.registration.requiredMessage')}</Box>
            <Link
              href={oracleData.registrationInstructions ?? ''}
              onClick={handleLinkClick}
              target="_blank"
              rel="noopener"
              sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
            >
              {oracleData.registrationInstructions}
            </Link>
            <Box>{t('worker.registration.completeMessage')}</Box>
            <FormProvider {...methods}>
              <form
                onSubmit={(event) =>
                  void methods.handleSubmit(handleRegistrationComplete)(event)
                }
              >
                <Stack spacing={2} alignItems="center">
                  <FormCaptcha
                    name="h_captcha_token"
                    error={userRegistrationError}
                  />
                  <Button
                    disabled={!hasClickedRegistrationLink}
                    fullWidth
                    loading={isUserRegistrationPending}
                    type="submit"
                    variant="contained"
                  >
                    {t('worker.registration.completeButton')}
                  </Button>
                </Stack>
              </form>
            </FormProvider>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
