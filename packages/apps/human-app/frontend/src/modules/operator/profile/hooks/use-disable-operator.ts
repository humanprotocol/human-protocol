import { useMutation } from '@tanstack/react-query';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { OperatorStatus } from '@/modules/auth-web3/context/web3-auth-context';
import { useWeb3AuthenticatedUser } from '@/modules/auth-web3/hooks/use-web3-authenticated-user';
import { authService } from '@/api';
import * as operatorProfileService from '../services/profile.service';

export function useDisableWeb3Operator() {
  const { address, chainId } = useConnectedWallet();
  const { updateUserData } = useWeb3AuthenticatedUser();
  return useMutation({
    mutationFn: async ({ signature }: { signature: string }) => {
      await operatorProfileService.disableOperator(signature);

      await authService.refreshAccessToken();

      // eslint-disable-next-line camelcase
      updateUserData({ operator_status: OperatorStatus.INACTIVE });
    },
    mutationKey: ['disableOperator', address, chainId],
  });
}
