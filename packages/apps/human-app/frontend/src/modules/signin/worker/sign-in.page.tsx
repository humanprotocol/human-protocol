import { useEffect } from 'react';
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
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import { useIsUserVerified } from '@/shared/hooks';

function formattedSignInErrorMessage(
  unknownError: unknown
): string | undefined {
  if (unknownError instanceof ApiClientError && unknownError.status === 401) {
    return t('worker.signInForm.errors.invalidCredentials');
  }
}

export function SignInWorkerPage() {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const { colorPalette } = useColorMode();
  const isUserVerified = useIsUserVerified();

  const { signIn, error, isError, isLoading, reset } = useSignIn();

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
    if (status === 'loading' || !user) {
      return;
    }

    if (user.status === 'pending' && !user.kyc_status) {
      navigate(routerPaths.worker.verifyEmail, {
        state: { routerState: { email: user.email } },
      });
      return;
    }

    if (isUserVerified) {
      navigate(routerPaths.worker.profile);
      return;
    }

    navigate(routerPaths.worker.verifyUser);
  }, [user, navigate, isUserVerified, status]);

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
        alignItems: 'center',
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
              component="h1"
              variant="h4"
              sx={{ color: colorPalette.text.auxiliary100 }}
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
    </Paper>
  );
}
