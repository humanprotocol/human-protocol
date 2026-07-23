import { useEffect, useState } from 'react';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { getErrorMessageForError } from '@/shared/errors';
import { ApiClientError } from '@/api';
import { useSignIn } from './use-sign-in';
import { SignInForm } from './sign-in-form';

import signInImage from '@/assets/background-images/signin-background.png';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { BackButton } from '@/shared/components/ui/page-card/back-button';
import { useColorMode } from '@/shared/contexts/color-mode';
import { VerificationFlow } from './verification-flow';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { KycStatus } from '@/modules/worker/profile/types';
import { routerPaths } from '@/router/router-paths';

function formattedSignInErrorMessage(
  unknownError: unknown
): string | undefined {
  if (unknownError instanceof ApiClientError && unknownError.status === 401) {
    return t('worker.signInForm.errors.invalidCredentials');
  }
}

export function SignInWorkerPage() {
  const [isVerificationRequired, setIsVerificationRequired] = useState(false);
  const { signIn, error, isSuccess, isError, isLoading, reset } = useSignIn();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colorPalette } = useColorMode();

  useEffect(() => {
    if (isError) {
      const message = getErrorMessageForError(
        error,
        formattedSignInErrorMessage
      );
      showNotification({
        message,
        type: TopNotificationType.ERROR,
      });
    }
  }, [isError, error, showNotification]);

  useEffect(() => {
    if (!isSuccess || !user) {
      return;
    }

    if (user.kyc_status === KycStatus.APPROVED && user.wallet_address) {
      navigate(routerPaths.worker.profile);
      return;
    }

    setIsVerificationRequired(true);
  }, [isSuccess, user, navigate]);

  const handleBackButton = () => {
    navigate(-1);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flex: 1,
        alignSelf: 'stretch',
        alignItems: {
          xs: isVerificationRequired ? 'flex-start' : 'center',
          md: 'center',
        },
        justifyContent: 'center',
        my: { xs: 0, md: 4 },
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
      {isVerificationRequired ? (
        <VerificationFlow
          isKycApproved={user?.kyc_status === KycStatus.APPROVED}
        />
      ) : (
        <Grid
          container
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            height: '100%',
            alignItems: 'stretch',
          }}
        >
          <Grid size={{ xs: 0, md: 6 }} sx={{ position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${signInImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </Grid>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              pt: { xs: '4vh', md: '5vh' },
              pb: { xs: '10vh', md: '5vh' },
              px: { xs: 2, md: '4vw' },
              height: '100%',
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: { xs: 3, md: 6 },
                gap: 1.5,
              }}
            >
              <BackButton onClick={handleBackButton} />
              <Typography
                sx={{
                  color: colorPalette.text.auxiliary100,
                  fontSize: { xs: '20px', md: '34px' },
                  fontWeight: { xs: 700, md: 800 },
                  lineHeight: { xs: '150%', md: 'normal' },
                }}
              >
                {t('worker.signInForm.title')}
              </Typography>
            </Box>
            <SignInForm
              onSubmit={signIn}
              error={error}
              isLoading={isLoading}
              resetMutation={reset}
            />
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}
