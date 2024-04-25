import { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import { t } from 'i18next';
import Typography from '@mui/material/Typography';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { useVerifyEmailMutation } from '@/api/servieces/worker/email-verification';
import { SuccessLabel } from '@/components/ui/success-label';
import {
  PageCard,
  PageCardError,
  PageCardLoader,
} from '@/components/ui/page-card';
import { useLocationState } from '@/hooks/use-location-state';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';

const tokenSchema = z.string().transform((value, ctx) => {
  const token = value.split('=')[1];
  if (!token) {
    ctx.addIssue({
      fatal: true,
      code: z.ZodIssueCode.custom,
      message: 'error',
    });
  }

  return token;
});

export function EmailVerificationWorkerPage() {
  const { field: token } = useLocationState({
    schema: tokenSchema,
    locationStorage: 'search',
  });

  const {
    mutate: emailVerificationWorkerMutate,
    error: emailVerificationWorkerError,
    isError: isEmailVerificationWorkerError,
    isPending: isEmailVerificationWorkerPending,
    data: emailVerificationData,
  } = useVerifyEmailMutation();

  useEffect(() => {
    emailVerificationWorkerMutate({ token: token || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);

  if (isEmailVerificationWorkerError) {
    return (
      <PageCardError
        errorMessage={defaultErrorMessage(emailVerificationWorkerError)}
      />
    );
  }

  if (isEmailVerificationWorkerPending || !emailVerificationData) {
    return <PageCardLoader />;
  }

  return (
    <PageCard
      title={<SuccessLabel>{t('worker.emailVerification.title')}</SuccessLabel>}
    >
      <Grid container gap="2rem">
        <Typography variant="body1">
          {t('worker.emailVerification.description')}
        </Typography>
        <Button
          component={Link}
          fullWidth
          to={routerPaths.worker.signIn}
          type="submit"
          variant="contained"
        >
          {t('worker.emailVerification.btn')}
        </Button>
      </Grid>
    </PageCard>
  );
}
