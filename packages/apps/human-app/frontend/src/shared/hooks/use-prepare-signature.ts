import { useMutation } from '@tanstack/react-query';
import {
  authService,
  type PrepareSignatureType,
} from '@/shared/services/signature.service';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';

export function usePrepareSignature(type: PrepareSignatureType) {
  const { address } = useWalletConnect();

  const mutation = useMutation({
    mutationFn: () => {
      if (!address) {
        throw new Error('No address provided. Please connect your wallet.');
      }

      return authService.prepareSignature({
        address,
        type,
      });
    },
    mutationKey: ['prepareSignature', type],
  });

  return {
    prepareSignature: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
