import { useRef, useEffect, useCallback } from 'react';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { useRegisterAddress } from '@/modules/worker/hooks/use-register-address';
import { useRegisterAddressNotifications } from '../../hooks/use-register-address-notifications';

export function useWorkerWalletRegistration() {
  const modalWasOpened = useRef(false);
  const { isConnected, address, openModal } = useWalletConnect();
  const { onSuccess, onError } = useRegisterAddressNotifications();
  const {
    mutate: registerAddressMutation,
    isPending: isRegisterAddressPending,
  } = useRegisterAddress({
    onError,
    onSuccess,
  });

  useEffect(() => {
    if (isConnected && modalWasOpened.current) {
      registerAddressMutation();
    }
  }, [address, isConnected, registerAddressMutation]);

  const handleConnectWallet = useCallback(() => {
    modalWasOpened.current = true;
    void openModal();
  }, [openModal]);

  return {
    isConnected,
    isRegisterAddressPending,
    handleConnectWallet,
    modalWasOpened,
  };
}
