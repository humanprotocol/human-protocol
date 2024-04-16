import { Trans, useTranslation } from 'react-i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import type { SignUpDto } from '@/api/servieces/worker/sign-up';
import {
  signUpDtoSchema,
  useSignUpMutation,
} from '@/api/servieces/worker/sign-up';
import { FetchError } from '@/api/fetcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/data-entry/input';
import { Password } from '@/components/data-entry/password';
import { FormCard } from '@/components/ui/form-card';

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

export function SignUpWorkerPage() {
  const { t } = useTranslation();
  const methods = useForm<SignUpDto>({
    defaultValues: {
      email: '',
      password: '',
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
    signUpWorkerMutate(data);
  }

  return (
    <FormCard
      alert={
        isSignUpWorkerError
          ? formattedSignUpErrorMessage(signUpWorkerError)
          : undefined
      }
      title={t('worker.signInForm.title')}
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
            />
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
