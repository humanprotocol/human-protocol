import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';
import { OperatorStatus } from '@/modules/auth-web3/context/web3-auth-context';
import { useWeb3AuthenticatedUser } from '@/modules/auth-web3/hooks/use-web3-authenticated-user';

export function useDisableWeb3Operator() {
  const { address, chainId } = useConnectedWallet();
  const { refreshAccessTokenAsync } = useAccessTokenRefresh();
  const { updateUserData } = useWeb3AuthenticatedUser();
  return useMutation({
    mutationFn: async ({ signature }: { signature: string }) => {
      const result = await apiClient(apiPaths.operator.disableOperator.path, {
        skipValidation: true,
        authenticated: true,
        withAuthRetry: apiPaths.operator.disableOperator.withAuthRetry,
        options: {
          method: 'POST',
          body: JSON.stringify({ signature }),
        },
      });

      await refreshAccessTokenAsync({ authType: 'web3' });
      // eslint-disable-next-line camelcase
      updateUserData({ operator_status: OperatorStatus.INACTIVE });

      return result;
    },
    mutationKey: ['disableOperator', address, chainId],
  });
}
