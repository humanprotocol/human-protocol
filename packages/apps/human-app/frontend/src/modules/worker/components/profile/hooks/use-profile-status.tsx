import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { routerPaths } from '@/router/router-paths';
import type { ProfileStatus } from '@/modules/worker/components/profile/types/profile-types';

export function useProfileStatus(): ProfileStatus {
  const { user } = useAuthenticatedUser();
  const navigate = useNavigate();
  const emailVerified = user.status === 'active';

  useEffect(() => {
    if (!emailVerified) {
      navigate(routerPaths.worker.verifyEmail, {
        replace: true,
        state: { routerState: { email: user.email } },
      });
    }
  }, [navigate, user.email, emailVerified]);

  return {
    emailVerified,
    kycApproved: user.kyc_status === 'approved',
    kycDeclined: user.kyc_status === 'declined',
    kycToComplete: !(
      user.kyc_status === 'approved' || user.kyc_status === 'declined'
    ),
  };
}
