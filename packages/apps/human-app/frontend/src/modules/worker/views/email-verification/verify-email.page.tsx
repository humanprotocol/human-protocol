/* eslint-disable camelcase -- ...*/
import { Grid, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { PageCard } from '@/shared/components/ui/page-card';
import { PageCardLoader } from '@/shared/components/ui/page-card-loader';
import { useLocationState } from '@/modules/worker/hooks/use-location-state';
import { env } from '@/shared/env';
import type { ResendEmailVerificationDto } from '@/modules/worker/services/resend-email-verification';
import {
  resendEmailVerificationHcaptchaSchema,
  useResendEmailVerificationWorkerMutation,
  useResendEmailVerificationWorkerMutationState,
} from '@/modules/worker/services/resend-email-verification';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { HCaptchaForm } from '@/shared/components/hcaptcha/h-captcha-form';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import { MailTo } from '@/shared/components/ui/mail-to';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';

export function VerifyEmailWorkerPage() {
  const { colorPalette, isDarkMode } = useColorMode();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const isAuthenticated = Boolean(user);
  const { t } = useTranslation();
  const { field: routerState } = useLocationState({
    keyInStorage: 'routerState',
    schema: z.object({
      email: z.string().email(),
      resendOnMount: z.boolean().optional(),
    }),
  });
  const mutationState = useResendEmailVerificationWorkerMutationState();
  const {
    mutate: resendEmailVerificationMutation,
    reset: resendEmailVerificationMutationReset,
  } = useResendEmailVerificationWorkerMutation();

  const methods = useForm<Pick<ResendEmailVerificationDto, 'h_captcha_token'>>({
    defaultValues: {
      h_captcha_token: '',
    },
    resolver: zodResolver(resendEmailVerificationHcaptchaSchema),
  });

  useResetMutationErrors(methods.watch, resendEmailVerificationMutationReset);

  const handleResend = (
    data: Pick<ResendEmailVerificationDto, 'h_captcha_token'>
  ) => {
    resendEmailVerificationMutation({
      email: routerState?.email ?? '',
      h_captcha_token: data.h_captcha_token,
    });
  };

  if (mutationState?.status === 'pending') {
    return <PageCardLoader />;
  }

  return (
    <PageCard
      alert={
        mutationState?.status === 'error' ? (
          <Alert color="error" severity="error">
            {getErrorMessageForError(mutationState.error)}
          </Alert>
        ) : undefined
      }
      cancelRouterPathOrCallback={() => {
        signOut();
        navigate(routerPaths.homePage);
      }}
      title={t('worker.verifyEmail.title')}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={(event) => {
            void methods.handleSubmit(handleResend)(event);
          }}
        >
          <Grid container gap="2rem" sx={{ paddingTop: '1rem' }}>
            <Typography>
              <Trans
                components={{
                  1: <Typography component="span" fontWeight={600} />,
                }}
                i18nKey="worker.verifyEmail.paragraph1"
                values={{ email: routerState?.email }}
              />
            </Typography>
            <Typography
              color={
                isDarkMode
                  ? onlyDarkModeColor.additionalTextColor
                  : colorPalette.primary.light
              }
              variant="body1"
            >
              {t('worker.verifyEmail.paragraph2')}
            </Typography>
            <Typography variant="body1">
              <Trans
                components={{
                  1: <Typography component="span" fontWeight={600} />,
                }}
                i18nKey="worker.verifyEmail.paragraph3"
              />
            </Typography>
            {isAuthenticated ? (
              <>
                <HCaptchaForm
                  error={mutationState?.error}
                  name="h_captcha_token"
                />
                <Button fullWidth type="submit" variant="outlined">
                  {t('worker.verifyEmail.btn')}
                </Button>
              </>
            ) : null}
            <Typography variant="body1">
              <Trans
                components={{
                  1: (
                    <Typography
                      component="span"
                      fontWeight={600}
                      variant="body1"
                    />
                  ),
                  2: <MailTo mail={env.VITE_HUMAN_SUPPORT_EMAIL} />,
                }}
                i18nKey="worker.verifyEmail.paragraph4"
              />
            </Typography>
          </Grid>
        </form>
      </FormProvider>
    </PageCard>
  );
}
