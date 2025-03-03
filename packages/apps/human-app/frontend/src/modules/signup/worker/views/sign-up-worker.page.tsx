import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useTranslation, Trans } from 'react-i18next';
import type { SignUpDto } from '@/modules/worker/services/sign-up';
import { signUpDtoSchema } from '@/modules/worker/services/sign-up';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/data-entry/input';
import { Password } from '@/shared/components/data-entry/password/password';
import { PageCard } from '@/shared/components/ui/page-card';
import { env } from '@/shared/env';
import { getErrorMessageForError } from '@/shared/errors';
import { Alert } from '@/shared/components/ui/alert';
import { HCaptchaForm } from '@/shared/components/hcaptcha';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { FetchError } from '@/api/fetcher';
import { useSignUpWorker } from '@/modules/signup/worker/hooks/use-sign-up-worker';

export function SignUpWorkerPage() {
  const { t } = useTranslation();
  const { signUp, error, isError, isLoading, reset } = useSignUpWorker();
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

  useResetMutationErrors(methods.watch, reset);

  const handleSignupError = (unknownError: unknown) => {
    if (unknownError instanceof FetchError && unknownError.status === 409) {
      return t('worker.signUpForm.errors.emailTaken');
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void methods.handleSubmit(signUp)(event);
  };

  return (
    <PageCard
      alert={
        isError ? (
          <Alert color="error" severity="error" sx={{ width: '100%' }}>
            {getErrorMessageForError(isError, handleSignupError)}
          </Alert>
        ) : undefined
      }
      title={t('worker.signUpForm.title')}
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit}>
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
            <HCaptchaForm error={error} name="h_captcha_token" />
            <Button
              fullWidth
              loading={isLoading}
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
