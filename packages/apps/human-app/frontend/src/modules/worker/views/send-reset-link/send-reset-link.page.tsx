/* eslint-disable camelcase -- ...*/
import { FormProvider, useForm } from 'react-hook-form';
import { Grid, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { PageCard } from '@/shared/components/ui/page-card';
import { Input } from '@/shared/components/data-entry/input';
import { Button } from '@/shared/components/ui/button';
import type { SendResetLinkDto } from '@/modules/worker/services/send-reset-link';
import {
  sendResetLinkDtoSchema,
  useSendResetLinkMutation,
} from '@/modules/worker/services/send-reset-link';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { FormCaptcha } from '@/shared/components/h-captcha';
import { routerPaths } from '@/router/router-paths';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';

export function SendResetLinkWorkerPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const methods = useForm<SendResetLinkDto>({
    defaultValues: {
      email: user?.email ?? '',
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
            {getErrorMessageForError(sendResetLinkWorkerError)}
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
          <Grid container gap="1.5rem">
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
