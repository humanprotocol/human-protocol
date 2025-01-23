import { useWalletConnect } from '@/shared/hooks/use-wallet-connect';

export function useRegisterAddressValidation() {
  const { address } = useWalletConnect();

  const errors = {
    noAddress: !address,
  };

  return {
    isValid: !Object.values(errors).some(Boolean),
    errors,
  };
}
