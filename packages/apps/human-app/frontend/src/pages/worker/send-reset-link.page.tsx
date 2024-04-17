import { FormProvider, useForm } from 'react-hook-form';
import { Grid, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FormCard } from '@/components/ui/form-card';
import { Input } from '@/components/data-entry/input';
import { Button } from '@/components/ui/button';
import { Password } from '@/components/data-entry/password/password';
import { FetchError } from '@/api/fetcher';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { useSendResetLinkMutation } from '@/api/servieces/worker/send-reset-link';
import { signInDtoSchema } from '@/api/servieces/worker/sign-in';
import { routerPaths } from '@/router/router-paths';

function formattedSendResetLinkErrorMessage(unknownError: unknown) {
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

const signUpDtoSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type SignUpDto = z.infer<typeof signUpDtoSchema>;

export function SendResetLinkWorkerPage() {
  const { t } = useTranslation();
  const { setGrayBackground } = useBackgroundColorStore();

  useEffect(() => {
    setGrayBackground();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);

  const methods = useForm<SignUpDto>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(signInDtoSchema),
  });

  const {
    mutate: sendResetLinkWorkerMutate,
    error: sendResetLinkWorkerError,
    isError: isSendResetLinkWorkerError,
    isPending: isSendResetLinkWorkerPending,
  } = useSendResetLinkMutation();

  function handleWorkerSendResetLink(data: SignUpDto) {
    sendResetLinkWorkerMutate(data);
  }

  return (
    <FormCard
      alert={
        isSendResetLinkWorkerError
          ? formattedSendResetLinkErrorMessage(sendResetLinkWorkerError)
          : undefined
      }
      title={t('worker.signInForm.title')}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={(event) =>
            void methods.handleSubmit(handleWorkerSendResetLink)(event)
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
              <Link to={routerPaths.sendResetLink}>
                {t('worker.signInForm.forgotPassword')}
              </Link>
            </Typography>
            <Button
              disabled={isSendResetLinkWorkerPending}
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
