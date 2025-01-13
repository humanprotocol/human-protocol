import { useRef, useEffect } from 'react';
import { useWalletConnect } from '@/shared/hooks/use-wallet-connect';
import { useRegisterAddressMutation } from '@/modules/worker/hooks/use-register-address';
import { useRegisterAddressNotifications } from '@/modules/worker/hooks/use-register-address-notifications';

export function useWalletActions() {
  const { isConnected, address, openModal } = useWalletConnect();

  const { onSuccess, onError } = useRegisterAddressNotifications();
  const {
    mutate: registerAddressMutation,
    isPending: isRegisterAddressPending,
  } = useRegisterAddressMutation({
    onError,
    onSuccess,
  });

  const modalWasOpened = useRef(false);

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
