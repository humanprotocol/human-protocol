import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

export function useWeb3SignUp() {
  const { address, chainId } = useConnectedWallet();

  return useMutation({
    mutationFn: async ({ signature }: { signature: string }) =>
      apiClient(apiPaths.operator.web3Auth.signUp.path, {
        successSchema: z.unknown(),
        options: {
          method: 'POST',
          body: JSON.stringify({ address, signature }),
        },
      }),
    mutationKey: ['web3SignUp', address, chainId],
  });
}
