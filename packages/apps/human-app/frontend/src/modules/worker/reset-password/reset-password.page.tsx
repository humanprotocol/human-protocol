import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { t } from 'i18next';
import omit from 'lodash/omit';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { Button } from '@/shared/components/ui/button';
import { Password } from '@/shared/components/data-entry/password/password';
import { PageCard } from '@/shared/components/ui/page-card';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { routerPaths } from '@/router/router-paths';
import { HCaptchaForm } from '@/shared/components/hcaptcha';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { useResetPasswordMutation } from './hooks';
import { resetPasswordDtoSchema } from './schemas';
import { type ResetPasswordDto } from './types';

export function ResetPasswordWorkerPage() {
  const location = useLocation();
  const { token } = queryString.parse(location.search);

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

  return (
    <PageCard
      alert={
        isResetPasswordWorkerError ? (
          <Alert color="error" severity="error" sx={{ width: '100%' }}>
            {getErrorMessageForError(resetPasswordWorkerError)}
          </Alert>
        ) : undefined
      }
      cancelNavigation={routerPaths.worker.profile}
      showBackButton={false}
      title={t('worker.resetPassword.title')}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={(event) => {
            void methods.handleSubmit(handleWorkerResetPassword)(event);
          }}
        >
          <Grid container gap="1.5rem">
            <Typography variant="body1">
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
