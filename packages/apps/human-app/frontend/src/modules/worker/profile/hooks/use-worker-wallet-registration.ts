import { useCallback } from 'react';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { useRegisterAddress } from '@/modules/worker/hooks/use-register-address';
import { useRegisterAddressNotifications } from '../../hooks/use-register-address-notifications';

export function useWorkerWalletRegistration() {
  const { isConnected, openModal } = useWalletConnect();
  const { onSuccess, onError } = useRegisterAddressNotifications();
  const {
    mutate: registerAddressMutation,
    isPending: isRegisterAddressPending,
  } = useRegisterAddress({
    onError,
    onSuccess,
  });

  const handleConnectWallet = useCallback(() => {
    void openModal();
    registerAddressMutation();
  }, [openModal, registerAddressMutation]);

  return {
    isConnected,
    isRegisterAddressPending,
    handleConnectWallet,
  };
}
