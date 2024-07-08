/* eslint-disable camelcase -- ... */
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { t } from 'i18next';
import omit from 'lodash/omit';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { Button } from '@/components/ui/button';
import { Password } from '@/components/data-entry/password/password';
import { PageCard } from '@/components/ui/page-card';
import type { ResetPasswordDto } from '@/api/servieces/worker/reset-password';
import {
  resetPasswordDtoSchema,
  useResetPasswordMutation,
} from '@/api/servieces/worker/reset-password';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { passwordChecks } from '@/components/data-entry/password/password-checks';
import { routerPaths } from '@/router/router-paths';
import { FormCaptcha } from '@/components/h-captcha';

export function ResetPasswordWorkerPage() {
  const location = useLocation();
  const { token } = queryString.parse(location.search);

  const methods = useForm<ResetPasswordDto>({
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
  } = useResetPasswordMutation();

  const handleWorkerResetPassword = (data: ResetPasswordDto) => {
    resetPasswordWorkerMutate(
      omit({ ...data, token: token?.toString() || '' }, ['confirmPassword'])
    );
  };

  return (
    <PageCard
      alert={
        isResetPasswordWorkerError ? (
          <Alert color="error" severity="error" sx={{ width: '100%' }}>
            {defaultErrorMessage(resetPasswordWorkerError)}
          </Alert>
        ) : undefined
      }
      backArrowPath={routerPaths.worker.profile}
      hiddenCancelButton
      title={t('worker.resetPassword.title')}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={(event) => {
            void methods.handleSubmit(handleWorkerResetPassword)(event);
          }}
        >
          <Grid container gap="2rem">
            <Typography variant="body1">
              {t('worker.resetPassword.description')}
            </Typography>
            <Password
              label={t('worker.resetPassword.fields.createNewPassword')}
              name="password"
              passwordCheckHeader="Password must contain at least:"
              passwordChecks={passwordChecks}
            />
            <Password
              label={t('worker.resetPassword.fields.confirm')}
              name="confirmPassword"
            />
            <FormCaptcha
              error={resetPasswordWorkerError}
              name="h_captcha_token"
            />
            <Button
              fullWidth
              loading={isResetPasswordWorkerPending}
              type="submit"
              variant="contained"
            >
              {t('worker.profile.resetPassword')}
            </Button>
          </Grid>
        </form>
      </FormProvider>
    </PageCard>
  );
}
