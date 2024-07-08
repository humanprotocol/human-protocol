import { FormProvider, useForm } from 'react-hook-form';
import { Grid, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { t as i18NextT } from 'i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PageCard } from '@/components/ui/page-card';
import { Input } from '@/components/data-entry/input';
import { Button } from '@/components/ui/button';
import { Password } from '@/components/data-entry/password/password';
import type { SignInDto } from '@/api/servieces/worker/sign-in';
import {
  signInDtoSchema,
  useSignInMutation,
} from '@/api/servieces/worker/sign-in';
import { FetchError } from '@/api/fetcher';
import { routerPaths } from '@/router/router-paths';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/auth/use-auth';
import { FormCaptcha } from '@/components/h-captcha';

function formattedSignInErrorMessage(unknownError: unknown) {
  if (unknownError instanceof FetchError && unknownError.status === 400) {
    return i18NextT('worker.signInForm.errors.invalidCredentials');
  }
}

export function SignInWorkerPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(routerPaths.worker.profile, { replace: true });
    }
  }, [navigate, user]);

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
  } = useSignInMutation();

  function handleWorkerSignIn(data: SignInDto) {
    signInWorkerMutate(data);
  }

  return (
    <PageCard
      alert={
        isSignInWorkerError ? (
          <Alert color="error" severity="error" sx={{ width: '100%' }}>
            {defaultErrorMessage(
              signInWorkerError,
              formattedSignInErrorMessage
            )}
          </Alert>
        ) : undefined
      }
      backArrowPath={routerPaths.homePage}
      title={t('worker.signInForm.title')}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={(event) =>
            void methods.handleSubmit(handleWorkerSignIn)(event)
          }
        >
          <Grid container gap="2rem" sx={{ paddingTop: '1rem' }}>
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
            <FormCaptcha error={signInWorkerError} name="h_captcha_token" />
            <Typography variant="body1">
              <Link
                style={{ textDecoration: 'none', fontWeight: 600 }}
                to={routerPaths.worker.sendResetLink}
              >
                {t('worker.signInForm.forgotPassword')}
              </Link>
            </Typography>
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
