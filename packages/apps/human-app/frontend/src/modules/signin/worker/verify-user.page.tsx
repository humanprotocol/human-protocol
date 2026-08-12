import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Paper, Stack } from '@mui/material';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import { KycStatus } from '@/modules/worker/profile/types';
import { routerPaths } from '@/router/router-paths';
import { useIsUserVerified } from '@/shared/hooks';
import { VerificationFlow } from './verification-flow';
import { Loader } from '@/shared/components/ui/loader';

export function VerifyUserPage() {
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const isUserVerified = useIsUserVerified();

  const isEmailVerificationPending =
    user?.status === 'pending' && !user.kyc_status;

  useEffect(() => {
    if (status === 'loading' || !user) {
      return;
    }

    if (isEmailVerificationPending) {
      navigate(routerPaths.verifyEmail, {
        replace: true,
        state: { routerState: { email: user.email } },
      });
      return;
    }

    if (isUserVerified) {
      navigate(routerPaths.profile, { replace: true });
    }
  }, [status, user, navigate, isUserVerified, isEmailVerificationPending]);

  const isLoading =
    status === 'loading' || isEmailVerificationPending || isUserVerified;

  if (!isLoading && !user) {
    return <Navigate replace to={routerPaths.signIn} />;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flex: 1,
        alignSelf: 'stretch',
        alignItems: {
          xs: 'flex-start',
          md: 'center',
        },
        justifyContent: 'center',
        my: { xs: 0, md: 4 },
        borderRadius: '30px',
        borderBottomLeftRadius: { xs: 0, md: '30px' },
        borderBottomRightRadius: { xs: 0, md: '30px' },
        border: { xs: 'none', md: '1px solid' },
        borderColor: (theme) => ({
          xs: 'none',
          md: theme.palette.border.main,
        }),
        overflow: 'hidden',
      }}
    >
      {isLoading ? (
        <Stack
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Loader />
        </Stack>
      ) : (
        <VerificationFlow
          isKycApproved={user?.kyc_status === KycStatus.APPROVED}
        />
      )}
    </Paper>
  );
}
