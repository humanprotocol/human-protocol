/* eslint-disable camelcase -- ...*/
import { Grid, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { colorPalette } from '@/styles/color-palette';
import { PageCard, PageCardLoader } from '@/components/ui/page-card';
import { useLocationState } from '@/hooks/use-location-state';
import { env } from '@/shared/env';
import type { ResendEmailVerificationDto } from '@/api/servieces/worker/resend-email-verification';
import {
  resendEmailVerificationHcaptchaSchema,
  useResendEmailVerificationWorkerMutation,
  useResendEmailVerificationWorkerMutationState,
} from '@/api/servieces/worker/resend-email-verification';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { FormCaptcha } from '@/components/h-captcha';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/use-auth';
import { routerPaths } from '@/router/router-paths';

export function VerifyEmailWorkerPage() {
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
  const { mutate: resendEmailVerificationMutation } =
    useResendEmailVerificationWorkerMutation();

  const methods = useForm<Pick<ResendEmailVerificationDto, 'h_captcha_token'>>({
    defaultValues: {
      h_captcha_token: '',
    },
    resolver: zodResolver(resendEmailVerificationHcaptchaSchema),
  });

  const handleResend = (
    data: Pick<ResendEmailVerificationDto, 'h_captcha_token'>
  ) => {
    resendEmailVerificationMutation({
      email: routerState?.email || '',
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
            {defaultErrorMessage(mutationState.error)}
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
            <Typography color={colorPalette.primary.light} variant="body1">
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
                <FormCaptcha
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
                  2: (
                    <Link
                      rel="noreferrer"
                      target="_blank"
                      to={env.VITE_HUMAN_PROTOCOL_HELP_URL}
                    />
                  ),
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
