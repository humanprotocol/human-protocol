import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Divider, Grid, Link, Paper, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/data-entry/input';
import { Password } from '@/shared/components/data-entry/password';
import { env } from '@/shared/env';
import { getErrorMessageForError } from '@/shared/errors';
import { HCaptchaForm } from '@/shared/components/hcaptcha';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { useSignUpWorker } from '@/modules/signup/worker/hooks/use-sign-up-worker';
import { ApiClientError } from '@/api';
import { signUpDtoSchema } from '../schema';
import signUpImage from '@/assets/background-images/signup-background.png';
import { BackButton } from '@/shared/components/ui/page-card/back-button';

import { routerPaths } from '@/router/router-paths';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { useColorMode } from '@/shared/contexts/color-mode';

function handleSignupError(unknownError: unknown) {
  if (unknownError instanceof ApiClientError && unknownError.status === 409) {
    return t('worker.signUpForm.errors.emailTaken');
  }
}

export function SignUpWorkerPage() {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { colorPalette } = useColorMode();
  const { signUp, error, isError, isLoading, reset } = useSignUpWorker();
  const methods = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      hCaptchaToken: '',
    },
    resolver: zodResolver(signUpDtoSchema),
  });

  useEffect(() => {
    if (isError) {
      const errorMessage = getErrorMessageForError(error, handleSignupError);
      showNotification({
        message: errorMessage,
        type: TopNotificationType.ERROR,
      });
    }
  }, [isError, error, showNotification]);

  useResetMutationErrors(methods.watch, reset);

  const handleBackButton = () => {
    navigate(-1);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void methods.handleSubmit(signUp)(event);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignSelf: 'stretch',
        my: { xs: 0, md: 4 },
        bgcolor: colorPalette.background.paper,
        borderRadius: '30px',
        borderBottomLeftRadius: { xs: 0, md: '30px' },
        borderBottomRightRadius: { xs: 0, md: '30px' },
        border: { xs: 'none', md: '1px solid' },
        borderColor: {
          xs: 'none',
          md: colorPalette.border.main,
        },
        overflow: 'hidden',
      }}
    >
      <Grid
        container
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          height: '100%',
          alignItems: 'stretch',
        }}
      >
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            pt: { xs: '4vh', md: '5vh' },
            pb: { xs: '10vh', md: '5vh' },
            px: { xs: 2, md: '4vw' },
            height: '100%',
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: { xs: 3, md: 6 },
              gap: 1.5,
            }}
          >
            <BackButton onClick={handleBackButton} />
            <Typography
              sx={{
                color: colorPalette.text.auxiliary100,
                fontSize: { xs: '20px', md: '34px' },
                fontWeight: { xs: 700, md: 800 },
                lineHeight: { xs: '150%', md: 'normal' },
              }}
            >
              {t('worker.signUpForm.title')}
            </Typography>
          </Box>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit}>
              <Grid container sx={{ gap: 3 }}>
                <Input
                  label={t('worker.signUpForm.fields.email')}
                  name="email"
                />
                <Password
                  label={t('worker.signUpForm.fields.password')}
                  name="password"
                />
                <Password
                  label={t('worker.signUpForm.fields.confirmPassword')}
                  name="confirmPassword"
                />
                <Typography
                  sx={{
                    fontSize: '12px !important',
                    color: colorPalette.text.auxiliary100,
                  }}
                >
                  <Trans
                    components={{
                      1: (
                        <Link
                          href={env.VITE_TERMS_OF_SERVICE_URL}
                          sx={{ textDecoration: 'underline' }}
                          target="_blank"
                        />
                      ),
                      2: (
                        <Link
                          href={env.VITE_TERMS_OF_SERVICE_URL}
                          sx={{ textDecoration: 'underline' }}
                          target="_blank"
                        />
                      ),
                    }}
                    i18nKey="worker.signUpForm.termsOfServiceAndPrivacyPolicy"
                  />
                </Typography>
                <HCaptchaForm error={error} name="hCaptchaToken" />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  color="accent"
                  fullWidth
                  loading={isLoading}
                >
                  {t('worker.signUpForm.submitBtn')}
                </Button>
                <Box sx={{ position: 'relative', width: '100%' }}>
                  <Divider sx={{ bgcolor: '#c9c9c9' }} />
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontWeight: 700,
                      lineHeight: '125%',
                      letterSpacing: '0.25px',
                      color: colorPalette.text.primary,
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      bgcolor: colorPalette.background.paper,
                    }}
                  >
                    {t('worker.signUpForm.or')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mx: 'auto',
                    gap: 1,
                    '& > *': {
                      display: 'inline-flex',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      lineHeight: '26px',
                      letterSpacing: '0.1px',
                      color: colorPalette.text.auxiliary200,
                    }}
                  >
                    {t('worker.signUpForm.alreadyHaveAccount')}
                  </Typography>{' '}
                  <Link
                    component={RouterLink}
                    to={routerPaths.worker.signIn}
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      lineHeight: '26px',
                      letterSpacing: '0.1px',
                      color: colorPalette.accent.main,
                      textDecoration: 'underline',
                    }}
                  >
                    {t('worker.signUpForm.signIn')}
                  </Link>
                </Box>
              </Grid>
            </form>
          </FormProvider>
        </Grid>
        <Grid size={{ xs: 0, md: 6 }} sx={{ position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${signUpImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
