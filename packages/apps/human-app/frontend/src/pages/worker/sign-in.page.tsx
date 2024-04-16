import { FormProvider, useForm } from 'react-hook-form';
import { Grid, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FormCard } from '@/components/ui/form-card';
import { Input } from '@/components/data-entry/input';
import { Button } from '@/components/ui/button';
import { Password } from '@/components/data-entry/password/password';
import { useSignInMutation } from '@/api/servieces/worker/sign-in';
import { FetchError } from '@/api/fetcher';
import { routerPaths } from '@/shared/router-paths';

function formattedSignInErrorMessage(unknownError: unknown) {
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

export interface Inputs {
  email: string;
  password: string;
}

const signUpDtoSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type SignUpDto = z.infer<typeof signUpDtoSchema>;

export function SignInWorkerPage() {
  const { t } = useTranslation();
  const methods = useForm<SignUpDto>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(signUpDtoSchema),
  });

  const {
    mutate: signInWorkerMutate,
    error: signInWorkerError,
    isError: isSignInWorkerError,
    isPending: isSignInWorkerPending,
  } = useSignInMutation();

  function handleWorkerSignIn(data: SignUpDto) {
    signInWorkerMutate(data);
  }

  return (
    <FormCard
      alert={
        isSignInWorkerError
          ? formattedSignInErrorMessage(signInWorkerError)
          : undefined
      }
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
              <Link to={routerPaths.resetPassword}>
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
    </FormCard>
  );
}
