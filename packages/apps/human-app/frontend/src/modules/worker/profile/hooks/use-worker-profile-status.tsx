import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { type WorkerItentityVerificationStatus } from '../types';

export function useWorkerIdentityVerificationStatus(): WorkerItentityVerificationStatus {
  const { user } = useAuthenticatedUser();

  return {
    isVerificationCompleted: user.kyc_status === 'approved',
    status: user.kyc_status ?? 'none',
  };
}
