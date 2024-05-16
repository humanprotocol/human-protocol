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

export function ResetPasswordWorkerPage() {
  const location = useLocation();
  const { token } = queryString.parse(location.search);

  const methods = useForm<ResetPasswordDto>({
    defaultValues: {
      password: '',
      confirmPassword: '',
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
      omit(
        // eslint-disable-next-line camelcase -- api request
        { ...data, token: token?.toString() || '', h_captcha_token: 'token' },
        ['confirmPassword']
      )
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
      backArrowPath={-1}
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
