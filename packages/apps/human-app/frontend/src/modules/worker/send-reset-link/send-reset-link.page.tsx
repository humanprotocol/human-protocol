import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/components/data-entry/input';
import { Button } from '@/shared/components/ui/button';
import { getErrorMessageForError } from '@/shared/errors';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { HCaptchaForm } from '@/shared/components/hcaptcha';
import { routerPaths } from '@/router/router-paths';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { useSendResetLinkMutation } from './hooks';
import { type SendResetLinkDto, sendResetLinkDtoSchema } from './schemas';
import { BackButton } from '@/shared/components/ui/page-card/back-button';
import { useNavigate } from 'react-router-dom';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { PageCard } from '@/shared/components/ui/page-card';

export function SendResetLinkPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const methods = useForm({
    defaultValues: {
      email: user?.email ?? '',
      h_captcha_token: '',
    },
    resolver: zodResolver(sendResetLinkDtoSchema),
  });

  const {
    mutate: sendResetLinkMutate,
    error: sendResetLinkError,
    isError: isSendResetLinkError,
    isPending: isSendResetLinkPending,
    reset,
  } = useSendResetLinkMutation();

  useResetMutationErrors(methods.watch, reset);

  useEffect(() => {
    if (isSendResetLinkError) {
      const errorMessage = getErrorMessageForError(sendResetLinkError);
      showNotification({
        type: TopNotificationType.ERROR,
        message: errorMessage,
      });
    }
  }, [isSendResetLinkError, sendResetLinkError, showNotification]);

  function handleWorkerSendResetLink(data: SendResetLinkDto) {
    sendResetLinkMutate(data);
  }

  const handleBackButton = () => {
    navigate(routerPaths.profile);
  };

  return (
    <PageCard
      sx={{
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'center',
        py: { xs: 3, md: 0 },
        px: { xs: 2, md: 0 },
      }}
    >
      <Stack sx={{ width: { xs: '100%', md: '400px' } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: { xs: 3, md: 6 },
            gap: 1.5,
          }}
        >
          <BackButton onClick={handleBackButton} />
          <Typography
            component="h1"
            variant="h4"
            sx={{ color: 'text.auxiliary100' }}
          >
            {t('worker.sendResetLinkForm.title')}
          </Typography>
        </Box>
        <FormProvider {...methods}>
          <form
            onSubmit={(event) => {
              void methods.handleSubmit(handleWorkerSendResetLink)(event);
            }}
          >
            <Grid container sx={{ gap: 3 }}>
              <Typography variant="body4" sx={{ color: 'text.auxiliary100' }}>
                {t('worker.sendResetLinkForm.description')}
              </Typography>
              <Input
                fullWidth
                label={t('worker.sendResetLinkForm.fields.email')}
                name="email"
              />
              <HCaptchaForm error={sendResetLinkError} name="h_captcha_token" />
              <Button
                type="submit"
                variant="contained"
                color="accent"
                fullWidth
                loading={isSendResetLinkPending}
              >
                {t('worker.sendResetLinkForm.submitBtn')}
              </Button>
            </Grid>
          </form>
        </FormProvider>
      </Stack>
    </PageCard>
  );
}
