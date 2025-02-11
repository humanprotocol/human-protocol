import { useRef, useEffect } from 'react';
import { useRegisterAddressNotifications } from '@/modules/worker/hooks/use-register-address-notifications';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { useRegisterAddress } from '@/modules/worker/hooks/use-register-address';

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

  const handleConnectWallet = () => {
    modalWasOpened.current = true;
    void openModal();
  };

  return {
    isConnected,
    isRegisterAddressPending,
    handleConnectWallet,
    modalWasOpened,
  };
}
