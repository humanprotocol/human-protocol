import { FormProvider, useForm } from 'react-hook-form';
import { Box, Grid, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { t as i18NextT } from 'i18next';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { PageCard } from '@/shared/components/ui/page-card';
import { Input } from '@/shared/components/data-entry/input';
import { Button } from '@/shared/components/ui/button';
import { Password } from '@/shared/components/data-entry/password/password';
import { useSignInMutation } from '@/modules/worker/services/sign-in/sign-in';
import { FetchError } from '@/api/fetcher';
import { routerPaths } from '@/router/router-paths';
import { getErrorMessageForError } from '@/shared/errors';
import { Alert } from '@/shared/components/ui/alert';
import { FormCaptcha } from '@/shared/components/h-captcha';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { type SignInDto } from '@/modules/worker/services/sign-in/types';
import { signInDtoSchema } from '@/modules/worker/services/sign-in/schema';

function formattedSignInErrorMessage(unknownError: unknown) {
  if (unknownError instanceof FetchError && unknownError.status === 400) {
    return i18NextT('worker.signInForm.errors.invalidCredentials');
  }
}

export function SignInWorkerPage() {
  const { t } = useTranslation();

  useEffect(() => {
    browserAuthProvider.signOut({ triggerSignOutSubscriptions: false });
  }, []);

  const methods = useForm<SignInDto>({
    defaultValues: {
      email: '',
      password: '',
      // eslint-disable-next-line camelcase -- export vite config
      h_captcha_token: '',
    },
    resolver: zodResolver(signInDtoSchema),
  });

  const {
    mutate: signInWorkerMutate,
    error: signInWorkerError,
    isError: isSignInWorkerError,
    isPending: isSignInWorkerPending,
    reset: signInWorkerMutationReset,
  } = useSignInMutation();

  useResetMutationErrors(methods.watch, signInWorkerMutationReset);

  function handleWorkerSignIn(data: SignInDto) {
    signInWorkerMutate(data);
  }

  return (
    <PageCard
      alert={
        isSignInWorkerError ? (
          <Alert color="error" severity="error" sx={{ width: '100%' }}>
            {getErrorMessageForError(
              signInWorkerError,
              formattedSignInErrorMessage
            )}
          </Alert>
        ) : undefined
      }
      title={t('worker.signInForm.title')}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={(event) =>
            void methods.handleSubmit(handleWorkerSignIn)(event)
          }
        >
          <Grid container gap="1.5rem">
            <Input
              fullWidth
              label={t('worker.signInForm.fields.email')}
              name="email"
            />
            <Password
              fullWidth
              label={t('worker.signInForm.fields.password')}
              name="password"
            />
            <Box width="100%">
              <Typography variant="body1">
                <Link
                  style={{
                    textDecoration: 'none',
                    fontWeight: 600,
                    color: 'inherit',
                  }}
                  to={routerPaths.worker.sendResetLink}
                >
                  {t('worker.signInForm.forgotPassword')}
                </Link>
              </Typography>
            </Box>
            <FormCaptcha error={signInWorkerError} name="h_captcha_token" />
            <Button
              fullWidth
              loading={isSignInWorkerPending}
              type="submit"
              variant="contained"
            >
              {t('worker.signInForm.submitBtn')}
            </Button>
          </Grid>
        </form>
      </FormProvider>
    </PageCard>
  );
}
