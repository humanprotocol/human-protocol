import { Navigate, useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useAuth } from '@/auth/use-auth';
import { PageCard, PageCardLoader } from '@/components/ui/page-card';
import { routerPaths } from '@/router/router-paths';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { Button } from '@/components/ui/button';
import { useResendEmailVerificationWorkerMutation } from '@/api/servieces/worker/resend-email-verification';

export function EmailVerificationErrorPage({ error }: { error: unknown }) {
  const { user, status } = useAuth();
  const navigate = useNavigate();

  const { mutate: resendEmailVerificationWorkerMutation } =
    useResendEmailVerificationWorkerMutation();

  if (status === 'loading') {
    return <PageCardLoader cardMaxWidth="100%" />;
  }

  if (!user) {
    return <Navigate to={routerPaths.worker.signIn} />;
  }

  return (
    <PageCard
      alert={
        <Alert color="error" severity="error">
          {defaultErrorMessage(error)}
        </Alert>
      }
      backArrowPath={routerPaths.homePage}
      title={t('worker.sendEmailVerificationError.title')}
    >
      <Grid container gap="2rem">
        <Typography variant="body1">
          {t('worker.sendEmailVerificationError.description')}
        </Typography>
        <Button
          fullWidth
          onClick={() => {
            resendEmailVerificationWorkerMutation({ email: user.email });
            navigate(routerPaths.worker.sendEmailVerification, {
              state: { routerState: { email: user.email } },
            });
          }}
          variant="outlined"
        >
          {t('worker.sendEmailVerificationError.btn')}
        </Button>
      </Grid>
    </PageCard>
  );
}
