import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { useGetAccessTokenMutation } from '@/api/servieces/common/get-access-token';
import { useWeb3AuthenticatedUser } from '@/auth-web3/use-web3-authenticated-user';

export function useDisableWeb3Operator() {
  const { address, chainId } = useConnectedWallet();
  const { mutateAsync } = useGetAccessTokenMutation();
  const { updateUserData } = useWeb3AuthenticatedUser();
  return useMutation({
    mutationFn: async ({ signature }: { signature: string }) => {
      const result = apiClient(apiPaths.operator.disableOperator.path, {
        skipValidation: true,
        authenticated: true,
        options: {
          method: 'POST',
          body: JSON.stringify({ signature }),
        },
      });

      await mutateAsync('web3');
      updateUserData({ status: 'INACTIVE' });
      return result;
    },
    mutationKey: ['disableOperator', address, chainId],
  });
}
