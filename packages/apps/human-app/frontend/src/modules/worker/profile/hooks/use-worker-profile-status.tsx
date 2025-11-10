import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { KycStatus, type WorkerItentityVerificationStatus } from '../types';

export function useWorkerIdentityVerificationStatus(): WorkerItentityVerificationStatus {
  const { user } = useAuthenticatedUser();

  return {
    isVerificationCompleted: user.kyc_status === KycStatus.APPROVED,
    status: user.kyc_status ?? KycStatus.NONE,
  };
}
