import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import type { ProfileStatus } from '@/modules/worker/components/profile/types/profile-types';

export function useProfileStatus(): ProfileStatus {
  const { user } = useAuthenticatedUser();

  return {
    emailVerified: user.status === 'active',
    kycApproved: user.kyc_status === 'approved',
    kycDeclined: user.kyc_status === 'declined',
    kycToComplete: !(
      user.kyc_status === 'approved' || user.kyc_status === 'declined'
    ),
  };
}
