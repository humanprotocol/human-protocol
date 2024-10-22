import { useState, useEffect } from 'react';
import { Box, Grid, Link, Paper, Stack } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormCaptcha } from '@/components/h-captcha';
import { Button } from '@/components/ui/button';
import {
  type RegistrationDto,
  registrationDtoSchema,
  useUserRegistrationMutation,
} from '@/api/services/worker/user-registration';
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

  const { registeredOracles, setRegisteredOracles } = useRegisteredOracles();

  const methods = useForm<RegistrationDto>({
    defaultValues: {
      // eslint-disable-next-line camelcase
      oracle_address: oracleAddress,
      // eslint-disable-next-line camelcase
      h_captcha_token: '',
    },
    resolver: zodResolver(registrationDtoSchema),
  });

  const {
    mutate: userRegistrationMutate,
    isPending: isUserRegistrationPending,
    error: userRegistrationError,
  } = useUserRegistrationMutation();

  const handleLinkClick = () => {
    setHasClickedRegistrationLink(true);
  };

  const handleRegistrationComplete = (data: RegistrationDto) => {
    userRegistrationMutate(data, {
      onSuccess(_data) {
        if (oracleAddress !== undefined) {
          setRegisteredOracles((prevRegisteredOracles) => {
            return prevRegisteredOracles
              ? [...prevRegisteredOracles, oracleAddress]
              : [oracleAddress];
          });
        }
        navigate(`${routerPaths.worker.jobs}/${oracleAddress ?? ''}`, {
          state: {
            oracleAddress,
          },
        });
      },
    });
  };

  useEffect(() => {
    if (oracleData === undefined) {
      navigate(routerPaths.worker.jobsDiscovery);
    }
  }, [oracleData, navigate]);

  useEffect(() => {
    if (registeredOracles?.find((a) => a === oracleAddress)) {
      navigate(`${routerPaths.worker.jobs}/${oracleAddress ?? ''}`, {
        state: {
          oracleAddress,
        },
      });
    }
  }, [registeredOracles, oracleAddress, navigate]);

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
              href={oracleData?.registrationInstructions ?? ''}
              onClick={handleLinkClick}
              target="_blank"
              rel="noopener"
              sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
            >
              {oracleData?.registrationInstructions}
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
