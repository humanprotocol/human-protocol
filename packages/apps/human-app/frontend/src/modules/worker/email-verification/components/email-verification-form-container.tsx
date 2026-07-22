import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Paper } from '@mui/material';
import { PageCardLoader } from '@/shared/components/ui/page-card';
import { getErrorMessageForError } from '@/shared/errors';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { useResendEmailRouterParams, useResendEmail } from '../hooks';
import { ResendVerificationEmailForm } from './resend-verification-email-form';
import { useColorMode } from '@/shared/contexts/color-mode';

export function EmailVerificationFormContainer() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const routerState = useResendEmailRouterParams();
  const { methods, handleResend, isError, error, isSuccess } = useResendEmail();
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const { colorPalette } = useColorMode();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (isError) {
      showNotification({
        message: getErrorMessageForError(error),
        type: TopNotificationType.ERROR,
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
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignSelf: 'stretch',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        my: { xs: 0, md: 4 },
        py: { xs: 8, md: 0 },
        px: { xs: 2, md: 0 },
        bgcolor: colorPalette.background.paper,
        borderRadius: '30px',
        borderBottomLeftRadius: { xs: 0, md: '30px' },
        borderBottomRightRadius: { xs: 0, md: '30px' },
        border: { xs: 'none', md: '1px solid' },
        borderColor: {
          xs: 'none',
          md: colorPalette.border.main,
        },
        overflow: 'hidden',
      }}
    >
      <ResendVerificationEmailForm
        methods={methods}
        handleResend={handleResend}
        handleCancel={handleCancel}
        email={routerState.email}
        isAuthenticated={isAuthenticated}
      />
    </Paper>
  );
}
