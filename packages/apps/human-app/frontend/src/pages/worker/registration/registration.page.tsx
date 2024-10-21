import { useState } from 'react';
import { Box, Grid, Link, Paper, Stack } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { FormCaptcha } from '@/components/h-captcha';
import { Button } from '@/components/ui/button';
import { useUserRegistrationMutation } from '@/api/services/worker/user-register';
import { useRegisteredOracles } from '@/contexts/registered-oracles';
import { useGetOracles } from '@/api/services/worker/oracles';
import { routerPaths } from '@/router/router-paths';

export function RegistrationPage() {
  const navigate = useNavigate();
  const { address: oracleAddress } = useParams<{ address: string }>();
  const oracleData = useGetOracles().data?.find(
    (oracle) => oracle.address === oracleAddress
  );
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
    userRegistrationMutate(oracleAddress ?? '', {
      onSuccess(data) {
        setRegisteredOracles(
          registeredOracles?.concat([
            (data as { oracle_address: string }).oracle_address,
          ])
        );
        navigate(`${routerPaths.worker.jobs}/${oracleAddress ?? ''}`, {
          state: {
            oracleAddress,
          },
        });
      },
    });
  };

  if (oracleData === undefined) {
    navigate(routerPaths.worker.jobsDiscovery);
    return;
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
