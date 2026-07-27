import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { t } from 'i18next';
import omit from 'lodash/omit';
import { useLocation, useNavigate } from 'react-router-dom';
import queryString from 'query-string';

import { Button } from '@/shared/components/ui/button';
import { Password } from '@/shared/components/data-entry/password';
import { getErrorMessageForError } from '@/shared/errors';
import { routerPaths } from '@/router/router-paths';
import { HCaptchaForm } from '@/shared/components/hcaptcha';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { useResetPasswordMutation } from './hooks';
import { resetPasswordDtoSchema } from './schemas';
import { type ResetPasswordDto } from './types';
import { BackButton } from '@/shared/components/ui/page-card/back-button';
import { useColorMode } from '@/shared/contexts/color-mode';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';

export function ResetPasswordWorkerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = queryString.parse(location.search);
  const { colorPalette } = useColorMode();
  const { showNotification } = useNotification();

  const methods = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
      h_captcha_token: '',
    },
    resolver: zodResolver(resetPasswordDtoSchema),
  });

  const {
    mutate: resetPasswordWorkerMutate,
    error: resetPasswordWorkerError,
    isError: isResetPasswordWorkerError,
    isPending: isResetPasswordWorkerPending,
    reset: isResetPasswordWorkerMutationReset,
  } = useResetPasswordMutation();

  useResetMutationErrors(methods.watch, isResetPasswordWorkerMutationReset);

  const handleWorkerResetPassword = (data: ResetPasswordDto) => {
    resetPasswordWorkerMutate(
      omit({ ...data, token: token?.toString() ?? '' }, ['confirmPassword'])
    );
  };

  const handleBackButton = () => {
    navigate(routerPaths.worker.profile);
  };

  useEffect(() => {
    if (isResetPasswordWorkerError) {
      showNotification({
        type: TopNotificationType.ERROR,
        message: getErrorMessageForError(resetPasswordWorkerError),
      });
    }
  }, [isResetPasswordWorkerError, resetPasswordWorkerError, showNotification]);

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
            component="h3"
            sx={{
              color: colorPalette.text.auxiliary100,
              fontSize: { xs: '20px', md: '34px' },
              fontWeight: { xs: 700, md: 800 },
              lineHeight: { xs: '150%', md: 'normal' },
            }}
          >
            {t('worker.resetPassword.title')}
          </Typography>
        </Box>
        <FormProvider {...methods}>
          <form
            onSubmit={(event) => {
              void methods.handleSubmit(handleWorkerResetPassword)(event);
            }}
          >
            <Stack sx={{ gap: 3 }}>
              <Typography
                variant="body1"
                sx={{ color: colorPalette.text.auxiliary100 }}
              >
                {t('worker.resetPassword.description')}
              </Typography>
              <Password
                label={t('worker.resetPassword.fields.createNewPassword')}
                name="password"
              />
              <Password
                label={t('worker.resetPassword.fields.confirm')}
                name="confirmPassword"
              />
              <HCaptchaForm
                error={resetPasswordWorkerError}
                name="h_captcha_token"
              />
              <Button
                type="submit"
                variant="contained"
                color="accent"
                fullWidth
                loading={isResetPasswordWorkerPending}
              >
                {t('worker.profile.resetPassword')}
              </Button>
            </Stack>
          </form>
        </FormProvider>
      </Stack>
    </Paper>
  );
}
