import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';

export function useDisableWeb3Operator() {
  const { address, chainId } = useConnectedWallet();
  return useMutation({
    mutationFn: async ({ signature }: { signature: string }) =>
      apiClient(apiPaths.operator.disableOperator.path, {
        skipValidation: true,
        authenticated: true,
        authProviderType: 'web3',
        options: {
          method: 'POST',
          body: JSON.stringify({ signature }),
        },
      }),
    mutationKey: ['disableOperator', address, chainId],
  });
}
