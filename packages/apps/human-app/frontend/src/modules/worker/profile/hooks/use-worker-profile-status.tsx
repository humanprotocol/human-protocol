import { KycStatus, type WorkerItentityVerificationStatus } from '../types';
import { useAuth } from '@/modules/auth/hooks/use-auth';

export function useWorkerIdentityVerificationStatus(): WorkerItentityVerificationStatus {
  const { user } = useAuth();

  return {
    isVerificationCompleted: user?.kyc_status === KycStatus.APPROVED,
    status: user?.kyc_status ?? KycStatus.NONE,
  };
}
