import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { routerPaths } from '@/router/router-paths';
import { type WorkerProfileStatus } from '../types';

export function useWorkerProfileStatus(): WorkerProfileStatus {
  const { user } = useAuthenticatedUser();
  const navigate = useNavigate();

  const emailVerified = user.status === 'active';
  const kycApproved = user.kyc_status === 'approved';
  const kycDeclined = user.kyc_status === 'declined';
  const kycToComplete = !(kycApproved || kycDeclined);

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
    kycApproved,
    kycDeclined,
    kycToComplete,
  };
}
