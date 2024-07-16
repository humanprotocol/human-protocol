/* eslint-disable camelcase -- ...*/
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';
import { routerPaths } from '@/router/router-paths';

export const web3SignInSuccessResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export type Web3SignInSuccessResponse = z.infer<
  typeof web3SignInSuccessResponseSchema
>;

export function useWeb3SignUp() {
  const { address, chainId } = useConnectedWallet();
  const { signIn } = useWeb3Auth();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async ({ signature }: { signature: string }) =>
      apiClient(apiPaths.operator.web3Auth.signUp.path, {
        successSchema: web3SignInSuccessResponseSchema,
        options: {
          method: 'POST',
          body: JSON.stringify({ address, signature }),
        },
      }),
    onSuccess: (successResponse) => {
      signIn(successResponse);
      navigate(routerPaths.operator.profile);
    },
    mutationKey: ['web3SignUp', address, chainId],
  });
}
