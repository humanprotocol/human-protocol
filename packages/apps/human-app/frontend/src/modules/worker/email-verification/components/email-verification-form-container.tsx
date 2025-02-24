import { Navigate, useNavigate } from 'react-router-dom';
import { PageCard } from '@/shared/components/ui/page-card';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import { useResendEmailRouterParams, useResendEmail } from '../hooks';
import { ResendVerificationEmailForm } from './resend-verification-email-form';

export function EmailVerificationFormContainer() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const routerState = useResendEmailRouterParams();
  const { methods, handleResend } = useResendEmail(routerState?.email ?? '');

  const isAuthenticated = Boolean(user);

  const handleCancel = () => {
    signOut();
    navigate(routerPaths.homePage);
  };

  if (!routerState?.email) {
    return <Navigate to={routerPaths.homePage} />;
  }

  const alertComponent = methods.formState.isSubmitSuccessful ? (
    <Alert color="error" severity="error">
      {getErrorMessageForError(methods.formState.errors)}
    </Alert>
  ) : undefined;

  return (
    <PageCard
      alert={alertComponent}
      cancelNavigation={handleCancel}
      title="Verify Email"
    >
      <ResendVerificationEmailForm
        methods={methods}
        handleResend={handleResend}
        email={routerState.email}
        isAuthenticated={isAuthenticated}
      />
    </PageCard>
  );
}
