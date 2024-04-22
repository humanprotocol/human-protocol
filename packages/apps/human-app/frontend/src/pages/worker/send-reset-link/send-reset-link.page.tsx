import { FormProvider, useForm } from 'react-hook-form';
import { Grid, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { PageCard } from '@/components/ui/page-card';
import { Input } from '@/components/data-entry/input';
import { Button } from '@/components/ui/button';
import type { SendResetLinkDto } from '@/api/servieces/worker/send-reset-link';
import {
  sendResetLinkDtoSchema,
  useSendResetLinkMutation,
} from '@/api/servieces/worker/send-reset-link';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';

export function SendResetLinkWorkerPage() {
  const { t } = useTranslation();

  const methods = useForm<SendResetLinkDto>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(sendResetLinkDtoSchema),
  });

  const {
    mutate: sendResetLinkWorkerMutate,
    error: sendResetLinkWorkerError,
    isError: isSendResetLinkWorkerError,
    isPending: isSendResetLinkWorkerPending,
  } = useSendResetLinkMutation();

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
      backArrowPath={-1}
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
            <Button
              disabled={isSendResetLinkWorkerPending}
              fullWidth
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
