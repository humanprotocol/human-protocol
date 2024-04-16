import { useState } from 'react';
import Box from '@mui/material/Box';
import { Container } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import type { SignUpDto } from '@/api/servieces/worker/sign-up';
import {
  signUpDtoSchema,
  useSignUpMutation,
} from '@/api/servieces/worker/sign-up';
import { Alert } from '@/components/ui/alert';
import { FetchError } from '@/api/fetcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/data-entry/input';
import { Password } from '@/components/data-entry/password';
import { Captcha } from '@/components/h-captcha';

function formatedSignUpErrorMessage(unknownError: unknown) {
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

export function SignUpWorkerPage() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { t } = useTranslation();
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
    <Box>
      <Container>
        <FormProvider {...methods}>
          <form
            onSubmit={(event) =>
              void methods.handleSubmit(handleWorkerSignUp)(event)
            }
          >
            <Grid item xs={6}>
              <Input
                name="email"
                placeholder={t('worker.signUpForm.fields.email')}
              />
            </Grid>
            <Grid item xs={6}>
              <Password
                name="password"
                placeholder={t('worker.signUpForm.fields.createPassword')}
              />
            </Grid>
            <Grid item xs={6}>
              <Password
                name="confirmPassword"
                placeholder={t('worker.signUpForm.fields.confirmPassword')}
              />
            </Grid>
            <Captcha setCaptchaToken={setCaptchaToken} />
            <Button
              disabled={isSignUpWorkerPending}
              type="submit"
              variant="contained"
            >
              {t('worker.signUpForm.submitBtn')}
            </Button>
          </form>
        </FormProvider>

        {isSignUpWorkerError ? (
          <Alert severity="error">
            {formatedSignUpErrorMessage(signUpWorkerError)}
          </Alert>
        ) : null}
      </Container>
    </Box>
  );
}
