import { Grid, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { PageCard } from '@/components/ui/page-card';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';
import { useLocationState } from '@/hooks/use-location-state';
import { env } from '@/shared/env';
import { useSendResetLinkMutation } from '@/api/servieces/worker/send-reset-link';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';

export function SendResetLinkWorkerSuccessPage() {
  const { t } = useTranslation();
  const { field: email } = useLocationState({
    keyInStorage: 'email',
    schema: z.string().email(),
  });
  const { mutate, error, isError, isPending } = useSendResetLinkMutation();

  const resend = () => {
    if (email) {
      mutate({ email });
    }
  };

  return (
    <PageCard
      alert={
        isError ? (
          <Alert color="error" severity="error">
            {defaultErrorMessage(error)}
          </Alert>
        ) : undefined
      }
      title={t('worker.sendResetLinkForm.title')}
    >
      <Grid container gap="2rem">
        <Typography>
          <Trans
            components={{ 1: <Typography component="span" fontWeight={600} /> }}
            i18nKey="worker.sendResetLinkSuccess.paragraph1"
            values={{ email }}
          />
        </Typography>
        <Typography color={colorPalette.primary.light} variant="body1">
          {t('worker.sendResetLinkSuccess.paragraph2')}
        </Typography>
        <Typography variant="body1">
          <Trans
            components={{ 1: <Typography component="span" fontWeight={600} /> }}
            i18nKey="worker.sendResetLinkSuccess.paragraph3"
            values={{ email }}
          />
        </Typography>
        <Button
          disabled={!email}
          fullWidth
          loading={isPending}
          onClick={resend}
          variant="outlined"
        >
          {t('worker.sendResetLinkSuccess.btn')}
        </Button>

        <Typography variant="body1">
          <Trans
            components={{
              1: <Typography component="span" fontWeight={600} />,
              2: (
                <Link
                  rel="noreferrer"
                  target="_blank"
                  to={env.VITE_HUMAN_PROTOCOL_HELP_URL}
                />
              ),
            }}
            i18nKey="worker.sendResetLinkSuccess.paragraph4"
            values={{ email }}
          />
        </Typography>
      </Grid>
    </PageCard>
  );
}
