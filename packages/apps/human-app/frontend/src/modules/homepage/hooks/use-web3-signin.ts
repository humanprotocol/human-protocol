import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '@/modules/auth-web3/hooks/use-web3-auth';
import { routerPaths } from '@/router/router-paths';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { usePrepareSignature } from '@/shared/hooks';
import { PrepareSignatureType } from '@/shared/services/signature.service';
import * as homepageService from '../services/homepage.service';

export const web3SignInSuccessResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export type Web3SignInSuccessResponse = z.infer<
  typeof web3SignInSuccessResponseSchema
>;

export function useWeb3SignIn() {
  const { address, chainId, signMessage } = useWalletConnect();
  const { signIn } = useWeb3Auth();
  const navigate = useNavigate();
  const { prepareSignature } = usePrepareSignature(
    PrepareSignatureType.SIGN_IN
  );

  return useMutation({
    mutationFn: async () => {
      const data = await prepareSignature();

      const signature = await signMessage(JSON.stringify(data));

      if (!signature || !address) {
        throw new Error('Failed to sign message: missing arguments.');
      }

      return homepageService.web3SignIn({
        address,
        signature,
      });
    },
    onSuccess: (successResponse) => {
      signIn(successResponse);
      navigate(routerPaths.operator.profile);
    },

    mutationKey: ['web3SignIn', address, chainId],
  });
}
