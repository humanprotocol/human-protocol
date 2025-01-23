import { Trans } from 'react-i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { t } from 'i18next';
import omit from 'lodash/omit';
import { useEffect } from 'react';
import type { SignUpDto } from '@/modules/worker/services/sign-up';
import {
  signUpDtoSchema,
  useSignUpMutation,
} from '@/modules/worker/services/sign-up';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/data-entry/input';
import { Password } from '@/shared/components/data-entry/password/password';
import { PageCard } from '@/shared/components/ui/page-card';
import { env } from '@/shared/env';
import { getErrorMessageForError } from '@/shared/errors';
import { Alert } from '@/shared/components/ui/alert';
import { FetchError } from '@/api/fetcher';
import { HCaptchaForm } from '@/shared/components/hcaptcha/h-captcha-form';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';

function formattedSignUpErrorMessage(unknownError: unknown) {
  if (unknownError instanceof FetchError && unknownError.status === 409) {
    return t('worker.signUpForm.errors.emailTaken');
  }
}

export function SignUpWorkerPage() {
  useEffect(() => {
    browserAuthProvider.signOut({ triggerSignOutSubscriptions: false });
  }, []);

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
    reset: signUpWorkerMutationReset,
  } = useSignUpMutation();

  useResetMutationErrors(methods.watch, signUpWorkerMutationReset);

  const handleWorkerSignUp = (data: SignUpDto) => {
    signUpWorkerMutate(omit(data, ['confirmPassword']));
  };

  return (
    <PageCard
      alert={
        isSignUpWorkerError ? (
          <Alert color="error" severity="error" sx={{ width: '100%' }}>
            {getErrorMessageForError(
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
          <Grid container gap="1.5rem">
            <Input label={t('worker.signUpForm.fields.email')} name="email" />
            <Password
              label={t('worker.signUpForm.fields.password')}
              name="password"
            />
            <Password
              label={t('worker.signUpForm.fields.confirmPassword')}
              name="confirmPassword"
            />
            <Grid>
              <Typography fontSize="0.75rem" variant="textField">
                <Trans
                  components={{
                    1: (
                      <Link
                        href={env.VITE_TERMS_OF_SERVICE_URL}
                        sx={{ textDecoration: 'underline' }}
                        target="_blank"
                      />
                    ),
                    2: (
                      <Link
                        href={env.VITE_TERMS_OF_SERVICE_URL}
                        sx={{ textDecoration: 'underline' }}
                        target="_blank"
                      />
                    ),
                  }}
                  i18nKey="worker.signUpForm.termsOfServiceAndPrivacyPolicy"
                />
              </Typography>
            </Grid>
            <HCaptchaForm error={signUpWorkerError} name="h_captcha_token" />
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
