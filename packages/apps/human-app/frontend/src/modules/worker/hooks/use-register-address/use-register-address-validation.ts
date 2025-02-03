import { useMemo } from 'react';
import { t } from 'i18next';
import { useWalletConnect } from '@/shared/hooks/use-wallet-connect';

export function useRegisterAddressValidation() {
  const { address } = useWalletConnect();

  const errors = useMemo(() => {
    const errorList: string[] = [];
    if (!address) {
      errorList.push(t('errors.noAddress'));
    }
    return errorList;
  }, [address]);

  return {
    isValid: errors.length === 0,
    errors,
  };
}
