import { useEffect } from 'react';
import { Grid, Stack, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { useLocationState } from '@/modules/worker/hooks/use-location-state';
import { env } from '@/shared/env';
import { getErrorMessageForError } from '@/shared/errors';
import { HCaptchaForm } from '@/shared/components/hcaptcha';
import { MailTo } from '@/shared/components/ui/mail-to';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { useSendResetLinkMutation } from './hooks';
import {
  sendResetLinkHcaptchaDtoSchema,
  type SendResetLinkHcaptcha,
} from './schemas';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { PageCard } from '@/shared/components/ui/page-card';

export function SendResetLinkSuccessPage() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { field: email } = useLocationState({
    keyInStorage: 'email',
    schema: z.email(),
  });
  const { mutate, error, isError, isPending, reset } =
    useSendResetLinkMutation();

  const handleWorkerSendResetLink = (dto: SendResetLinkHcaptcha) => {
    mutate({ ...dto, email: email ?? '' });
  };

  const methods = useForm({
    defaultValues: {
      h_captcha_token: '',
    },
    resolver: zodResolver(sendResetLinkHcaptchaDtoSchema),
  });

  useResetMutationErrors(methods.watch, reset);

  useEffect(() => {
    if (isError) {
      showNotification({
        type: TopNotificationType.ERROR,
        message: getErrorMessageForError(error),
      });
    }
  }, [isError, error, showNotification]);

  return (
    <PageCard
      sx={{
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'center',
        py: { xs: 3, md: 0 },
        px: { xs: 2, md: 0 },
      }}
    >
      <Stack sx={{ width: { xs: '100%', md: '400px' }, gap: 3 }}>
        <Typography
          component="h1"
          variant="h4"
          sx={{ color: 'text.auxiliary100' }}
        >
          {t('worker.sendResetLinkForm.title')}
        </Typography>
        <FormProvider {...methods}>
          <form
            onSubmit={(event) => {
              void methods.handleSubmit(handleWorkerSendResetLink)(event);
            }}
          >
            <Grid container sx={{ gap: { xs: 2, md: 3 } }}>
              <Typography variant="body4" sx={{ color: 'text.auxiliary100' }}>
                <Trans
                  components={{
                    1: <Typography variant="body3" component="span" />,
                  }}
                  i18nKey="worker.sendResetLinkSuccess.paragraph1"
                  values={{ email }}
                />
              </Typography>
              <Typography variant="body4" sx={{ color: 'text.auxiliary200' }}>
                {t('worker.sendResetLinkSuccess.paragraph2')}
              </Typography>
              <Typography variant="body4" sx={{ color: 'text.auxiliary100' }}>
                <Trans
                  components={{
                    1: <Typography variant="body3" component="span" />,
                  }}
                  i18nKey="worker.sendResetLinkSuccess.paragraph3"
                  values={{ email }}
                />
              </Typography>
              <HCaptchaForm error={error} name="h_captcha_token" />
              <Button
                type="submit"
                variant="outlined"
                disabled={!email}
                fullWidth
                loading={isPending}
              >
                {methods.formState.submitCount > 0 ? (
                  <>{t('worker.sendResetLinkSuccess.btnAfterSend')}</>
                ) : (
                  <>{t('worker.sendResetLinkSuccess.btn')}</>
                )}
              </Button>
              <Typography variant="body4" sx={{ color: 'text.auxiliary100' }}>
                <Trans
                  components={{
                    1: <Typography component="span" variant="body3" />,
                    2: <MailTo mail={env.VITE_HUMAN_SUPPORT_EMAIL} />,
                  }}
                  i18nKey="worker.sendResetLinkSuccess.paragraph4"
                />
              </Typography>
            </Grid>
          </form>
        </FormProvider>
      </Stack>
    </PageCard>
  );
}
