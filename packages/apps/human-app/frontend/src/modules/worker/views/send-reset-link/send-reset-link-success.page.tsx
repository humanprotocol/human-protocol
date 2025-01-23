/* eslint-disable camelcase -- ... */
import { Grid, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { PageCard } from '@/shared/components/ui/page-card';
import { Button } from '@/shared/components/ui/button';
import { useLocationState } from '@/modules/worker/hooks/use-location-state';
import { env } from '@/shared/env';
import type { SendResetLinkHcaptcha } from '@/modules/worker/services/send-reset-link';
import {
  sendResetLinkHcaptchaDtoSchema,
  useSendResetLinkMutation,
} from '@/modules/worker/services/send-reset-link';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { HCaptchaForm } from '@/shared/components/hcaptcha/h-captcha-form';
import { MailTo } from '@/shared/components/ui/mail-to';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';

export function SendResetLinkWorkerSuccessPage() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { t } = useTranslation();
  const { field: email } = useLocationState({
    keyInStorage: 'email',
    schema: z.string().email(),
  });
  const { mutate, error, isError, isPending, reset } =
    useSendResetLinkMutation();

  const handleWorkerSendResetLink = (dto: SendResetLinkHcaptcha) => {
    mutate({ ...dto, email: email ?? '' });
  };

  const methods = useForm<SendResetLinkHcaptcha>({
    defaultValues: {
      h_captcha_token: '',
    },
    resolver: zodResolver(sendResetLinkHcaptchaDtoSchema),
  });

  useResetMutationErrors(methods.watch, reset);

  return (
    <PageCard
      alert={
        isError ? (
          <Alert color="error" severity="error">
            {getErrorMessageForError(error)}
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
          <Grid container gap="1.5rem">
            <Typography>
              <Trans
                components={{
                  1: <Typography component="span" fontWeight={600} />,
                }}
                i18nKey="worker.sendResetLinkSuccess.paragraph1"
                values={{ email }}
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
            <HCaptchaForm error={error} name="h_captcha_token" />
            <Button
              disabled={!email}
              fullWidth
              loading={isPending}
              type="submit"
              variant="outlined"
            >
              {methods.formState.submitCount > 0 ? (
                <>{t('worker.sendResetLinkSuccess.btnAfterSend')}</>
              ) : (
                <>{t('worker.sendResetLinkSuccess.btn')}</>
              )}
            </Button>

            <Typography variant="body1">
              <Trans
                components={{
                  1: <Typography component="span" fontWeight={600} />,
                  2: <MailTo mail={env.VITE_HUMAN_PROTOCOL_HELP_URL} />,
                }}
                i18nKey="worker.sendResetLinkSuccess.paragraph4"
              />
            </Typography>
          </Grid>
        </form>
      </FormProvider>
    </PageCard>
  );
}
