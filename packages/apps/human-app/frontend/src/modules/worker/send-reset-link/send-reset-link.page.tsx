import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Box, Grid, Paper, Stack, Typography } from '@mui/material';
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
import { useColorMode } from '@/shared/contexts/color-mode';
import { BackButton } from '@/shared/components/ui/page-card/back-button';
import { useNavigate } from 'react-router-dom';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';

export function SendResetLinkPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colorPalette } = useColorMode();
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
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flex: 1,
        alignSelf: 'stretch',
        justifyContent: 'center',
        alignItems: { xs: 'flex-start', md: 'center' },
        my: { xs: 0, md: 4 },
        py: { xs: 3, md: 0 },
        px: { xs: 2, md: 0 },
        bgcolor: colorPalette.background.paper,
        borderRadius: '30px',
        borderBottomLeftRadius: { xs: 0, md: '30px' },
        borderBottomRightRadius: { xs: 0, md: '30px' },
        border: { xs: 'none', md: '1px solid' },
        borderColor: {
          xs: 'none',
          md: colorPalette.border.main,
        },
        overflow: 'hidden',
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
            sx={{ color: colorPalette.text.auxiliary100 }}
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
              <Typography
                variant="body1"
                sx={{ color: colorPalette.text.auxiliary100 }}
              >
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
    </Paper>
  );
}
