import { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import { z } from 'zod';
import { Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { t } from 'i18next';
import type { SignUpDto } from '@/api/servieces/worker/sign-up';
import {
  signUpDtoSchema,
  useSignUpMutation,
} from '@/api/servieces/worker/sign-up';
import { FetchError } from '@/api/fetcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/data-entry/input';
import { Password } from '@/components/data-entry/password/password';
import { FormCard } from '@/components/ui/form-card';
import { Captcha } from '@/components/h-captcha';
import {
  password8Chars,
  passwordLowercase,
  passwordNumeric,
  passwordSpecialCharacter,
  passwordUppercase,
} from '@/shared/helpers/regex';
import { routerPaths } from '@/shared/router-paths';
import type { PasswordCheck } from '@/components/data-entry/password/password-check-label';
import { useBackgroundColorStore } from '@/hooks/use-background-store';

function formattedSignUpErrorMessage(unknownError: unknown) {
  if (
    unknownError instanceof FetchError &&
    (unknownError.status === 403 || unknownError.status === 401)
  ) {
    return <Trans>auth.login.errors.unauthorized</Trans>;
  }

  if (unknownError instanceof Error) {
    return <Trans>errors.withInfoCode</Trans>;
  }
  return <Trans>errors.unknown</Trans>;
}

const passwordChecks: PasswordCheck[] = [
  {
    requirementsLabel: t('validation.password8Chars'),
    schema: z.string().regex(password8Chars),
  },
  {
    requirementsLabel: t('validation.passwordUppercase'),
    schema: z.string().regex(passwordUppercase),
  },
  {
    requirementsLabel: t('validation.passwordLowercase'),
    schema: z.string().regex(passwordLowercase),
  },
  {
    requirementsLabel: t('validation.passwordNumeric'),
    schema: z.string().regex(passwordNumeric),
  },
  {
    requirementsLabel: t('validation.passwordSpecialCharacter'),
    schema: z.string().regex(passwordSpecialCharacter),
  },
];

export function SignUpWorkerPage() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { setGrayBackground } = useBackgroundColorStore();

  useEffect(() => {
    setGrayBackground();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);

  const methods = useForm<SignUpDto>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(signUpDtoSchema),
  });

  const {
    mutate: signUpWorkerMutate,
    error: signUpWorkerError,
    isError: isSignUpWorkerError,
    isPending: isSignUpWorkerPending,
  } = useSignUpMutation();

  function handleWorkerSignUp(data: SignUpDto) {
    if (captchaToken) {
      signUpWorkerMutate({ ...data, token: captchaToken });
    }
  }

  return (
    <FormCard
      alert={
        isSignUpWorkerError
          ? formattedSignUpErrorMessage(signUpWorkerError)
          : undefined
      }
      title={t('worker.signUpForm.title')}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={(event) =>
            void methods.handleSubmit(handleWorkerSignUp)(event)
          }
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
            <Grid width="100%">
              <Captcha setCaptchaToken={setCaptchaToken} />
            </Grid>
            <Grid>
              <Typography variant="textField">
                <Trans i18nKey="worker.signUpForm.termsOfServiceAndPrivacyPolicy">
                  Terms
                  <Link to={routerPaths.termsOfService} />
                  <Link to={routerPaths.privacyPolicy} />
                </Trans>
              </Typography>
            </Grid>
            <Button
              disabled={isSignUpWorkerPending}
              fullWidth
              type="submit"
              variant="contained"
            >
              {t('worker.signUpForm.submitBtn')}
            </Button>
          </Grid>
        </form>
      </FormProvider>
    </FormCard>
  );
}
