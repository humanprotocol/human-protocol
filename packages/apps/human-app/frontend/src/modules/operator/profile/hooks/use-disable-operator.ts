import { useMutation } from '@tanstack/react-query';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { OperatorStatus } from '@/modules/auth-web3/context/web3-auth-context';
import { useWeb3AuthenticatedUser } from '@/modules/auth-web3/hooks/use-web3-authenticated-user';
import { operatorProfileService } from '../services/profile.service';

export function useDisableWeb3Operator() {
  const { address, chainId } = useConnectedWallet();
  const { updateUserData } = useWeb3AuthenticatedUser();
  return useMutation({
    mutationFn: async ({ signature }: { signature: string }) => {
      const result = await operatorProfileService.disableOperator({
        signature,
      });

      await operatorProfileService.refreshAccessToken();

      // eslint-disable-next-line camelcase
      updateUserData({ operator_status: OperatorStatus.INACTIVE });

      return result;
    },
    mutationKey: ['disableOperator', address, chainId],
  });
}
