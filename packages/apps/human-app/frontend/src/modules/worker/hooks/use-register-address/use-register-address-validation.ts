import { useMemo } from 'react';
import { useWalletConnect } from '@/shared/hooks/use-wallet-connect';

export function useRegisterAddressValidation() {
  const { address } = useWalletConnect();

  const errors = useMemo(
    () => ({
      noAddress: !address,
    }),
    [address]
  );

  return {
    isValid: !Object.values(errors).some(Boolean),
    errors,
  };
}
