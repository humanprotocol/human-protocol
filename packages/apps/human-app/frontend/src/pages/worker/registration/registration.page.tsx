import { useState, useEffect } from 'react';
import { Box, Grid, Link, Paper, Stack } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormCaptcha } from '@/components/h-captcha';
import { Button } from '@/components/ui/button';
import {
  type RegistrationInExchangeOracleDto,
  registrationInExchangeOracleDtoSchema,
  useExchangeOracleRegistrationMutation,
} from '@/api/services/worker/registration-in-exchange-oracles';
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

  const methods = useForm<RegistrationInExchangeOracleDto>({
    defaultValues: {
      // eslint-disable-next-line camelcase
      oracle_address: oracleAddress,
      // eslint-disable-next-line camelcase
      h_captcha_token: '',
    },
    resolver: zodResolver(registrationInExchangeOracleDtoSchema),
  });

  const {
    mutate: userRegistrationMutate,
    isPending: isRegistrationInExchangeOraclePending,
    error: registrationInExchangeOracleError,
  } = useExchangeOracleRegistrationMutation();

  const handleLinkClick = () => {
    setHasClickedRegistrationLink(true);
  };

  const handleRegistrationComplete = (
    data: RegistrationInExchangeOracleDto
  ) => {
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
            <Box>
              {t('worker.registrationInExchangeOracle.requiredMessage')}
            </Box>
            <Link
              href={oracleData?.registrationInstructions ?? ''}
              onClick={handleLinkClick}
              rel="noopener"
              sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
              target="_blank"
            >
              {oracleData?.registrationInstructions}
            </Link>
            <Box>
              {t('worker.registrationInExchangeOracle.completeMessage')}
            </Box>
            <FormProvider {...methods}>
              <form
                onSubmit={(event) =>
                  void methods.handleSubmit(handleRegistrationComplete)(event)
                }
              >
                <Stack alignItems="center" spacing={2}>
                  <FormCaptcha
                    error={registrationInExchangeOracleError}
                    name="h_captcha_token"
                  />
                  <Button
                    disabled={!hasClickedRegistrationLink}
                    fullWidth
                    loading={isRegistrationInExchangeOraclePending}
                    type="submit"
                    variant="contained"
                  >
                    {t('worker.registrationInExchangeOracle.completeButton')}
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
