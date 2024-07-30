import { Trans } from 'react-i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { t } from 'i18next';
import omit from 'lodash/omit';
import { useEffect } from 'react';
import type { SignUpDto } from '@/api/servieces/worker/sign-up';
import {
  signUpDtoSchema,
  useSignUpMutation,
} from '@/api/servieces/worker/sign-up';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/data-entry/input';
import { Password } from '@/components/data-entry/password/password';
import { PageCard } from '@/components/ui/page-card';
import { env } from '@/shared/env';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { Alert } from '@/components/ui/alert';
import { FetchError } from '@/api/fetcher';
import { passwordChecks } from '@/components/data-entry/password/password-checks';
import { useAuth } from '@/auth/use-auth';
import { FormCaptcha } from '@/components/h-captcha';

function formattedSignUpErrorMessage(unknownError: unknown) {
  if (unknownError instanceof FetchError && unknownError.status === 409) {
    return t('worker.signUpForm.errors.emailTaken');
  }
}

export function SignUpWorkerPage() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      signOut();
    }
  }, [signOut, user]);

  const methods = useForm<SignUpDto>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      // eslint-disable-next-line camelcase -- export vite config
      h_captcha_token: '',
    },
    resolver: zodResolver(signUpDtoSchema),
  });

  const {
    mutate: signUpWorkerMutate,
    error: signUpWorkerError,
    isError: isSignUpWorkerError,
    isPending: isSignUpWorkerPending,
  } = useSignUpMutation();

  const handleWorkerSignUp = (data: SignUpDto) => {
    signUpWorkerMutate(omit(data, ['confirmPassword']));
  };

  return (
    <PageCard
      alert={
        isSignUpWorkerError ? (
          <Alert color="error" severity="error" sx={{ width: '100%' }}>
            {defaultErrorMessage(
              signUpWorkerError,
              formattedSignUpErrorMessage
            )}
          </Alert>
        ) : undefined
      }
      title={t('worker.signUpForm.title')}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={(event) => {
            void methods.handleSubmit(handleWorkerSignUp)(event);
          }}
        >
          <Grid container gap="2rem">
            <Input label={t('worker.signUpForm.fields.email')} name="email" />
            <Password
              label={t('worker.signUpForm.fields.password')}
              name="password"
              passwordCheckHeader="Password must contain at least:"
              passwordChecks={passwordChecks}
            />
            <Password
              label={t('worker.signUpForm.fields.confirmPassword')}
              name="confirmPassword"
            />
            <FormCaptcha error={signUpWorkerError} name="h_captcha_token" />
            <Grid>
              <Typography fontSize="0.75rem" variant="textField">
                <Trans i18nKey="worker.signUpForm.termsOfServiceAndPrivacyPolicy">
                  Terms
                  <Link href={env.VITE_TERMS_OF_SERVICE_URL} target="_blank" />
                  <Link href={env.VITE_PRIVACY_POLICY_URL} target="_blank" />
                </Trans>
              </Typography>
            </Grid>
            <Button
              fullWidth
              loading={isSignUpWorkerPending}
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
