import { Grid, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { colorPalette } from '@/styles/color-palette';
import { PageCard, PageCardLoader } from '@/components/ui/page-card';
import { useLocationState } from '@/hooks/use-location-state';
import { env } from '@/shared/env';
import { useResendEmailVerificationWorkerMutationState } from '@/api/servieces/worker/resend-email-verification';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';

export function SendEmailVerificationWorkerPage() {
  const { t } = useTranslation();
  const { field: routerState } = useLocationState({
    keyInStorage: 'routerState',
    schema: z.object({
      email: z.string().email(),
      resendOnMount: z.boolean().optional(),
    }),
  });
  const mutationState = useResendEmailVerificationWorkerMutationState();

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
      title={t('worker.sendEmailVerification.title')}
    >
      <Grid container gap="2rem" sx={{ paddingTop: '1rem' }}>
        <Typography>
          <Trans
            components={{
              1: <Typography component="span" fontWeight={600} />,
            }}
            i18nKey="worker.sendEmailVerification.paragraph1"
            values={{ email: routerState?.email }}
          />
        </Typography>
        <Typography color={colorPalette.primary.light} variant="body1">
          {t('worker.sendEmailVerification.paragraph2')}
        </Typography>
        <Typography variant="body1">
          <Trans
            components={{
              1: <Typography component="span" fontWeight={600} />,
            }}
            i18nKey="worker.sendEmailVerification.paragraph3"
          />
        </Typography>
        <Typography variant="body1">
          <Trans
            components={{
              1: <Typography component="span" variant="buttonMedium" />,
              2: (
                <Link
                  rel="noreferrer"
                  target="_blank"
                  to={env.VITE_HUMAN_PROTOCOL_HELP_URL}
                />
              ),
            }}
            i18nKey="worker.sendEmailVerification.paragraph4"
          />
        </Typography>
      </Grid>
    </PageCard>
  );
}
