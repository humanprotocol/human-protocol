import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';
import { useWalletConnect } from '@/shared/hooks/use-wallet-connect';
import {
  PrepareSignatureType,
  prepareSignature,
} from '@/api/hooks/use-prepare-signature';
import type { ResponseError } from '@/shared/types/global.type';

interface RegisterAddressCallbacks {
  onSuccess?: () => void | Promise<void>;
  onError?: (error: ResponseError) => void | Promise<void>;
}

interface RegisterAddressParams {
  address: string;
  signature: string;
}

interface RegisterAddressResponse {
  success: boolean;
}

const RegisterAddressSuccessSchema = z.object({
  success: z.boolean(),
});

const registerAddressRequest = async (
  params: RegisterAddressParams
): Promise<RegisterAddressResponse> => {
  return apiClient(apiPaths.worker.registerAddress.path, {
    authenticated: true,
    withAuthRetry: apiPaths.worker.registerAddress.withAuthRetry,
    successSchema: RegisterAddressSuccessSchema,
    options: {
      method: 'POST',
      body: JSON.stringify(params),
    },
  });
};

function useRegisterAddressMutation(callbacks?: RegisterAddressCallbacks) {
  const queryClient = useQueryClient();
  const { user } = useAuthenticatedUser();
  const { refreshAccessTokenAsync } = useAccessTokenRefresh();
  const { address, signMessage } = useWalletConnect();

  const mutationFn = async () => {
    if (!address) {
      throw new Error(t('errors.noAddress'));
    }

    const dataToSign = await prepareSignature({
      address,
      type: PrepareSignatureType.REGISTER_ADDRESS,
    });

    const messageToSign = JSON.stringify(dataToSign);
    const signature = await signMessage(messageToSign);

    if (!signature) {
      throw new Error(t('errors.cannotSignMessage'));
    }

    // wallet address is part of the JWT payload
    // so we need to refresh the token after the address is registered
    await registerAddressRequest({ address, signature });
    await refreshAccessTokenAsync({ authType: 'web2' });
  };

  const onSuccess = async () => {
    if (callbacks?.onSuccess) {
      await callbacks.onSuccess();
    }
    await queryClient.invalidateQueries();
  };

  const onError = async (error: ResponseError) => {
    if (callbacks?.onError) {
      await callbacks.onError(error);
    }
    await queryClient.invalidateQueries();
  };

  return useMutation({
    mutationFn,
    onSuccess,
    onError,
    mutationKey: [user.wallet_address],
  });
}

export function useRegisterAddress(callbacks?: RegisterAddressCallbacks) {
  const mutation = useRegisterAddressMutation(callbacks);

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
