/* eslint-disable camelcase -- ...*/
import { FormProvider, useForm } from 'react-hook-form';
import { Grid, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { PageCard } from '@/components/ui/page-card';
import { Input } from '@/components/data-entry/input';
import { Button } from '@/components/ui/button';
import type { SendResetLinkDto } from '@/api/services/worker/send-reset-link';
import {
  sendResetLinkDtoSchema,
  useSendResetLinkMutation,
} from '@/api/services/worker/send-reset-link';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { useAuth } from '@/auth/use-auth';
import { FormCaptcha } from '@/components/h-captcha';
import { routerPaths } from '@/router/router-paths';
import { useResetMutationErrors } from '@/hooks/use-reset-mutation-errors';

export function SendResetLinkWorkerPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const methods = useForm<SendResetLinkDto>({
    defaultValues: {
      email: user?.email || '',
      h_captcha_token: '',
    },
    resolver: zodResolver(sendResetLinkDtoSchema),
  });

  const {
    mutate: sendResetLinkWorkerMutate,
    error: sendResetLinkWorkerError,
    isError: isSendResetLinkWorkerError,
    isPending: isSendResetLinkWorkerPending,
    reset: sendResetLinkWorkerMutateReset,
  } = useSendResetLinkMutation();

  useResetMutationErrors(methods.watch, sendResetLinkWorkerMutateReset);

  function handleWorkerSendResetLink(data: SendResetLinkDto) {
    sendResetLinkWorkerMutate(data);
  }

  return (
    <PageCard
      alert={
        isSendResetLinkWorkerError ? (
          <Alert color="error" severity="error" sx={{ width: '100%' }}>
            {defaultErrorMessage(sendResetLinkWorkerError)}
          </Alert>
        ) : undefined
      }
      cancelRouterPathOrCallback={routerPaths.worker.profile}
      title={t('worker.sendResetLinkForm.title')}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={(event) => {
            void methods.handleSubmit(handleWorkerSendResetLink)(event);
          }}
        >
          <Grid container gap="2rem">
            <Typography variant="body1">
              {t('worker.sendResetLinkForm.description')}
            </Typography>
            <Input
              fullWidth
              label={t('worker.sendResetLinkForm.fields.email')}
              name="email"
            />
            <FormCaptcha
              error={sendResetLinkWorkerError}
              name="h_captcha_token"
            />
            <Button
              fullWidth
              loading={isSendResetLinkWorkerPending}
              type="submit"
              variant="contained"
            >
              {t('worker.sendResetLinkForm.submitBtn')}
            </Button>
          </Grid>
        </form>
      </FormProvider>
    </PageCard>
  );
}
