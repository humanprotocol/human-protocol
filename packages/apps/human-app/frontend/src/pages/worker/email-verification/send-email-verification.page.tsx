import { Grid, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { colorPalette } from '@/styles/color-palette';
import { PageCard } from '@/components/ui/page-card';
import { useLocationState } from '@/hooks/use-location-state';
import { Button } from '@/components/ui/button';
import { useResendEmailVerificationWorkerMutation } from '@/api/servieces/worker/resend-email-verification';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { env } from '@/shared/env';

export function SendEmailVerificationWorkerPage() {
  const { t } = useTranslation();
  const { field: routerState } = useLocationState({
    keyInStorage: 'routerState',
    schema: z.object({
      email: z.string().email(),
      resendOnMount: z.boolean().optional(),
    }),
  });
  const {
    mutate: resendEmailVerificationWorkerMutation,
    error: emailVerificationWorkerError,
    isError: isEmailVerificationWorkerError,
    isPending: isEmailVerificationWorkerPending,
    isSuccess: isEmailVerificationWorkerSuccess,
  } = useResendEmailVerificationWorkerMutation();

  const sendEmailVerificationMutation = () => {
    if (routerState?.email) {
      resendEmailVerificationWorkerMutation({ email: routerState.email });
    }
  };

  return (
    <Grid container>
      {isEmailVerificationWorkerSuccess ? (
        <Alert color="success" severity="success">
          {t('worker.sendEmailVerification.successResent')}
        </Alert>
      ) : null}
      <PageCard
        alert={
          isEmailVerificationWorkerError ? (
            <Alert color="error" severity="error">
              {defaultErrorMessage(emailVerificationWorkerError)}
            </Alert>
          ) : undefined
        }
        title={t('worker.sendEmailVerification.title')}
      >
        <Grid container gap="2rem" sx={{ paddingTop: '1rem' }}>
          <Typography>
            <Trans
              i18nKey="worker.sendEmailVerification.paragraph1"
              values={{ email: routerState?.email }}
            >
              Strong <Typography fontWeight={600} />
            </Trans>
          </Typography>
          <Typography color={colorPalette.primary.light} variant="body1">
            {t('worker.sendEmailVerification.paragraph2')}
          </Typography>
          <Typography variant="body1">
            <Trans i18nKey="worker.sendEmailVerification.paragraph3">
              Strong <Typography fontWeight={600} />
            </Trans>
          </Typography>
          <Button
            fullWidth
            loading={isEmailVerificationWorkerPending}
            onClick={sendEmailVerificationMutation}
            variant="outlined"
          >
            {t('worker.sendEmailVerification.btn')}
          </Button>
          <Typography variant="body1">
            <Trans i18nKey="worker.sendEmailVerification.paragraph4">
              Strong
              <Typography variant="buttonMedium" />
              <Link
                rel="noreferrer"
                target="_blank"
                to={env.VITE_HUMAN_PROTOCOL_HELP_URL}
              />
            </Trans>
          </Typography>
        </Grid>
      </PageCard>
    </Grid>
  );
}
