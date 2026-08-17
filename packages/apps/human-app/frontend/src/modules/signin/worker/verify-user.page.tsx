import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Stack } from '@mui/material';

import { VerificationFlow } from './verification-flow';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import { KycStatus } from '@/shared/types/entity.type';
import { useIsUserVerified } from '@/shared/hooks';
import { Loader } from '@/shared/components/ui/loader';
import { PageCard } from '@/shared/components/ui/page-card';

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
    <PageCard
      sx={{
        alignItems: {
          xs: 'flex-start',
          md: 'center',
        },
        justifyContent: 'center',
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
    </PageCard>
  );
}
