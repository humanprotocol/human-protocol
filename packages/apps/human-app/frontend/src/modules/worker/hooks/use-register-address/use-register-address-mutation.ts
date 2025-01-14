import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';
import { useWalletConnect } from '@/shared/hooks/use-wallet-connect';
import {
  PrepareSignatureType,
  prepareSignature,
} from '@/api/hooks/use-prepare-signature';
import { registerAddressRequest } from './register-address-request';
import type { RegisterAddressCallbacks } from './types';

export function useRegisterAddressMutation(
  callbacks?: RegisterAddressCallbacks
) {
  const queryClient = useQueryClient();
  const { user } = useAuthenticatedUser();
  const { refreshAccessTokenAsync } = useAccessTokenRefresh();
  const { address, signMessage } = useWalletConnect();

  return useMutation({
    mutationFn: async () => {
      if (!address) {
        throw new Error(t('errors.unknown'));
      }

      const dataToSign = await prepareSignature({
        address,
        type: PrepareSignatureType.REGISTER_ADDRESS,
      });

      const messageToSign = JSON.stringify(dataToSign);
      const signature = await signMessage(messageToSign);

      if (!signature) {
        throw new Error(t('errors.unknown'));
      }

      await registerAddressRequest({ address, signature });
      await refreshAccessTokenAsync({ authType: 'web2' });
    },
    onSuccess: async () => {
      if (callbacks?.onSuccess) {
        await callbacks.onSuccess();
      }
      await queryClient.invalidateQueries();
    },
    onError: async (error) => {
      if (callbacks?.onError) {
        await callbacks.onError(error);
      }
      await queryClient.invalidateQueries();
    },
    mutationKey: [user.wallet_address],
  });
}
