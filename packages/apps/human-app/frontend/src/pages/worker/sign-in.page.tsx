import { FormProvider, useForm } from 'react-hook-form';
import { Grid, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { t as i18NextT } from 'i18next';
import { Link } from 'react-router-dom';
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

function formattedSignInErrorMessage(unknownError: unknown) {
  if (unknownError instanceof FetchError && unknownError.status === 400) {
    return i18NextT('worker.signInForm.errors.invalidCredentials');
  }
}

export function SignInWorkerPage() {
  const { t } = useTranslation();

  const methods = useForm<SignInDto>({
    defaultValues: {
      email: '',
      password: '',
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
          <Grid container gap="2rem">
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
            <Typography variant="body1">
              <Link to={routerPaths.worker.sendResetLink}>
                {t('worker.signInForm.forgotPassword')}
              </Link>
            </Typography>
            <Button
              disabled={isSignInWorkerPending}
              fullWidth
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
