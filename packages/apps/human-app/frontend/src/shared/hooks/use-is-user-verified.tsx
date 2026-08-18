import { useAuth } from '@/modules/auth/hooks/use-auth';
import { KycStatus } from '@/shared/types/entity.type';

export function useIsUserVerified() {
  const { user } = useAuth();

  const kycStatus = user?.kyc_status as KycStatus;
  const hasWalletAddress = !!user?.wallet_address;

  return user && kycStatus === KycStatus.APPROVED && hasWalletAddress;
}
