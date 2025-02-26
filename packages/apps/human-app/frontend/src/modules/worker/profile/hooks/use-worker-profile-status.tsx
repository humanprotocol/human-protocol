import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { type WorkerProfileStatus } from '../types';

export function useWorkerKycStatus(): WorkerProfileStatus {
  const { user } = useAuthenticatedUser();

  const kycApproved = user.kyc_status === 'approved';
  const kycDeclined = user.kyc_status === 'declined';
  const kycToComplete = !(kycApproved || kycDeclined);

  return {
    kycApproved,
    kycDeclined,
    kycToComplete,
  };
}
