import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { t } from 'i18next';
import omit from 'lodash/omit';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Password } from '@/components/data-entry/password/password';
import { PageCard } from '@/components/ui/page-card';
import { routerPaths } from '@/router/router-paths';
import type { ResetPasswordDto } from '@/api/servieces/worker/reset-password';
import {
  resetPasswordDtoSchema,
  useResetPasswordMutation,
} from '@/api/servieces/worker/reset-password';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { passwordChecks } from '@/components/data-entry/password/password-checks';

export function ResetPasswordWorkerPage() {
  const { token } = useParams();

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
      omit({ ...data, token: token || '' }, ['confirmPassword'])
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
      backArrowPath={routerPaths.homePage}
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
              disabled={isResetPasswordWorkerPending}
              fullWidth
              type="submit"
              variant="contained"
            >
              {t('worker.signUpForm.submitBtn')}
            </Button>
          </Grid>
        </form>
      </FormProvider>
    </PageCard>
  );
}
