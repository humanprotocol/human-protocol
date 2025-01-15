import { useNavigate } from 'react-router-dom';
import { PageCard, PageCardLoader } from '@/shared/components/ui/page-card';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import { useResendEmail } from '@/modules/worker/hooks/use-resend-email';
import { useRouterState } from '@/modules/worker/hooks/use-router-state';
import { ResendVerificationEmailForm } from './resend-verification-email-form';

export function EmailVerificationFormContainer() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { methods, handleResend } = useResendEmail(routerState?.email ?? '');

  const isAuthenticated = Boolean(user);

  const handleCancel = () => {
    signOut();
    navigate(routerPaths.homePage);
  };

  if (!routerState?.email) {
    return <PageCardLoader />;
  }

  return (
    <PageCard
      alert={
        methods.formState.isSubmitSuccessful ? (
          <Alert color="error" severity="error">
            {getErrorMessageForError(methods.formState.errors)}
          </Alert>
        ) : undefined
      }
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
