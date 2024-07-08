/* eslint-disable camelcase -- ... */
import { Grid, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { PageCard } from '@/components/ui/page-card';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';
import { useLocationState } from '@/hooks/use-location-state';
import { env } from '@/shared/env';
import type { SendResetLinkHcaptcha } from '@/api/servieces/worker/send-reset-link';
import {
  sendResetLinkHcaptchaDtoSchema,
  useSendResetLinkMutation,
} from '@/api/servieces/worker/send-reset-link';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { FormCaptcha } from '@/components/h-captcha';

export function SendResetLinkWorkerSuccessPage() {
  const { t } = useTranslation();
  const { field: email } = useLocationState({
    keyInStorage: 'email',
    schema: z.string().email(),
  });
  const { mutate, error, isError, isPending } = useSendResetLinkMutation();

  const handleWorkerSendResetLink = (dto: SendResetLinkHcaptcha) => {
    mutate({ ...dto, email: email || '' });
  };

  const methods = useForm<SendResetLinkHcaptcha>({
    defaultValues: {
      h_captcha_token: '',
    },
    resolver: zodResolver(sendResetLinkHcaptchaDtoSchema),
  });

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
      <FormProvider {...methods}>
        <form
          onSubmit={(event) => {
            void methods.handleSubmit(handleWorkerSendResetLink)(event);
          }}
        >
          <Grid container gap="2rem">
            <Typography>
              <Trans
                components={{
                  1: <Typography component="span" fontWeight={600} />,
                }}
                i18nKey="worker.sendResetLinkSuccess.paragraph1"
                values={{ email }}
              />
            </Typography>
            <Typography color={colorPalette.primary.light} variant="body1">
              {t('worker.sendResetLinkSuccess.paragraph2')}
            </Typography>
            <Typography variant="body1">
              <Trans
                components={{
                  1: <Typography component="span" fontWeight={600} />,
                }}
                i18nKey="worker.sendResetLinkSuccess.paragraph3"
                values={{ email }}
              />
            </Typography>
            <FormCaptcha error={error} name="h_captcha_token" />
            <Button
              disabled={!email}
              fullWidth
              loading={isPending}
              type="submit"
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
        </form>
      </FormProvider>
    </PageCard>
  );
}
