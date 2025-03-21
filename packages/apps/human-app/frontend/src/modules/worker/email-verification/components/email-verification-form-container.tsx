import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageCard, PageCardLoader } from '@/shared/components/ui/page-card';
import { getErrorMessageForError } from '@/shared/errors';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { useResendEmailRouterParams, useResendEmail } from '../hooks';
import { ResendVerificationEmailForm } from './resend-verification-email-form';

export function EmailVerificationFormContainer() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const routerState = useResendEmailRouterParams();
  const { methods, handleResend, isError, error, isSuccess } = useResendEmail();
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    if (isError) {
      showNotification({
        message: getErrorMessageForError(error),
        type: TopNotificationType.WARNING,
      });
    }
  }, [isError, error, showNotification]);

  useEffect(() => {
    if (isSuccess && methods.formState.isSubmitSuccessful) {
      showNotification({
        message: t('worker.sendResetLinkSuccess.successResent'),
        type: TopNotificationType.SUCCESS,
      });
    }
  }, [isSuccess, methods.formState.isSubmitSuccessful, showNotification, t]);

  const handleCancel = () => {
    signOut();
    navigate(routerPaths.homePage);
  };

  if (!routerState?.email) {
    return <PageCardLoader />;
  }

  return (
    <PageCard cancelNavigation={handleCancel} title="Verify Email">
      <ResendVerificationEmailForm
        methods={methods}
        handleResend={handleResend}
        email={routerState.email}
        isAuthenticated={isAuthenticated}
      />
    </PageCard>
  );
}
