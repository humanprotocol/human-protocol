/* eslint-disable camelcase -- ...*/
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';
import { routerPaths } from '@/router/router-paths';
import type { PrepareSignatureBody } from '@/api/servieces/operator/prepare-signature';
import { prepareSignature } from '@/api/servieces/operator/prepare-signature';
import { useWalletConnect } from '@/hooks/use-wallet-connect';

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
  return useMutation({
    mutationFn: async (body: PrepareSignatureBody) => {
      const dataToSign = await prepareSignature(body);
      if (!signMessage) {
        throw new Error(t('errors.unknown'));
      }
      const signature = await signMessage(
        JSON.stringify({
          to: dataToSign.to,
          from: dataToSign.from,
          contents: dataToSign.contents,
        })
      );

      return apiClient(apiPaths.operator.web3Auth.signIn.path, {
        successSchema: web3SignInSuccessResponseSchema,
        options: {
          method: 'POST',
          body: JSON.stringify({ address, signature }),
        },
      });
    },
    onSuccess: (successResponse) => {
      signIn(successResponse);
      navigate(routerPaths.operator.profile);
    },
    mutationKey: ['web3SignIn', address, chainId],
  });
}
