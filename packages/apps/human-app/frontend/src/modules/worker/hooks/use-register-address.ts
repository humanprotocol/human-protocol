import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';
import type { ResponseError } from '@/shared/types/global.type';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { usePrepareSignature } from '@/shared/hooks';
import { PrepareSignatureType } from '@/shared/services/signature.service';
import * as profileService from '../profile/services/profile.service';

interface RegisterAddressCallbacks {
  onSuccess: () => void | Promise<void>;
  onError: (error: ResponseError) => void | Promise<void>;
}

function useRegisterAddressMutation(callbacks: RegisterAddressCallbacks) {
  const { user, updateUserData } = useAuthenticatedUser();
  const { refreshAccessTokenAsync } = useAccessTokenRefresh();
  const { address, chainId, signMessage } = useWalletConnect();
  const { prepareSignature } = usePrepareSignature(
    PrepareSignatureType.REGISTER_ADDRESS
  );

  const mutationFn = async () => {
    if (!address) {
      throw new Error(t('errors.noAddress'));
    }

    const data = await prepareSignature();
    const messageToSign = JSON.stringify(data);
    const signature = await signMessage(messageToSign);

    if (!signature) {
      throw new Error(t('errors.cannotSignMessage'));
    }

    // wallet address is part of the JWT payload
    // so we need to refresh the token after the address is registered
    await profileService.registerAddress({ address, chainId, signature });
    await refreshAccessTokenAsync({ authType: 'web2' });
    updateUserData({
      // eslint-disable-next-line camelcase
      wallet_address: address,
    });
  };

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await callbacks.onSuccess();
    },
    onError: async (error: ResponseError) => {
      await callbacks.onError(error);
    },
    mutationKey: [user.wallet_address],
  });
}

export function useRegisterAddress(callbacks: RegisterAddressCallbacks) {
  const mutation = useRegisterAddressMutation(callbacks);

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
