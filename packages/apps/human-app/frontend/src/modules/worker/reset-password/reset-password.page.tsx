import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Stack, Typography } from '@mui/material';
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
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { PageCard } from '@/shared/components/ui/page-card';

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = queryString.parse(location.search);
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
    navigate(routerPaths.profile);
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
    <PageCard
      sx={{
        justifyContent: 'center',
        alignItems: { xs: 'flex-start', md: 'center' },
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
              <Typography variant="body4" sx={{ color: 'text.auxiliary100' }}>
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
    </PageCard>
  );
}
