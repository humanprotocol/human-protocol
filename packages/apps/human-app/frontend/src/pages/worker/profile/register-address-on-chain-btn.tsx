import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useGetOnChainRegisteredAddress } from '@/api/servieces/worker/get-on-chain-registered-address';
import { useGetSignedAddress } from '@/api/servieces/worker/get-signed-address';
import { useRegisterAddressOnChainMutation } from '@/api/servieces/worker/use-register-address-on-chain';
import { DoneLabel } from '@/pages/worker/profile/done-label';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { useWalletConnect } from '@/hooks/use-wallet-connect';

export function RegisterAddressOnChainButton() {
  const { setTopNotification, closeNotification } =
    useProtectedLayoutNotification();
  const { isConnected: isWalletConnected, openModal } = useWalletConnect();
  const modalWasOpened = useRef(false);

  const {
    data: onChainRegisteredAddress,
    isError: inOnChainRegisteredAddressError,
    error: onChainRegisteredAddressError,
    isPending: isOnChainRegisteredAddressPending,
  } = useGetOnChainRegisteredAddress();

  const {
    data: signedAddress,
    isError: isSignedAddressError,
    error: signedAddressError,
    isPending: isSignedAddressPending,
  } = useGetSignedAddress();

  const {
    mutate: registerAddressOnChainMutation,
    isError: isRegisterAddressOnChainError,
    error: registerAddressOnChainError,
    isPending: isRegisterAddressOnChainPending,
  } = useRegisterAddressOnChainMutation();

  const isPending =
    isOnChainRegisteredAddressPending ||
    isSignedAddressPending ||
    isRegisterAddressOnChainPending;

  const isError =
    inOnChainRegisteredAddressError ||
    isSignedAddressError ||
    isRegisterAddressOnChainError;

  const error =
    onChainRegisteredAddressError ||
    signedAddressError ||
    registerAddressOnChainError;

  const isAddressSetInKVStore =
    onChainRegisteredAddress === signedAddress?.value;

  useEffect(() => {
    if (isError) {
      setTopNotification({
        type: 'warning',
        content: defaultErrorMessage(error),
      });
      return;
    }
    closeNotification();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ...
  }, [error, isError]);

  useEffect(() => {
    if (isWalletConnected && modalWasOpened.current && signedAddress) {
      registerAddressOnChainMutation(signedAddress);
    }
  }, [isWalletConnected, registerAddressOnChainMutation, signedAddress]);

  if (isPending) {
    return (
      <Button fullWidth loading>
        {t('worker.profile.addKYCInfoOnChain')}
      </Button>
    );
  }

  if (isError) {
    return (
      <Button disabled fullWidth>
        {t('worker.profile.addKYCInfoOnChain')}
      </Button>
    );
  }

  if (isAddressSetInKVStore) {
    return <DoneLabel>{t('worker.profile.kycInfoOnChainAdded')}</DoneLabel>;
  }

  return (
    <Button
      fullWidth
      onClick={() => {
        if (isWalletConnected) {
          registerAddressOnChainMutation(signedAddress);
        } else {
          modalWasOpened.current = true;
          void openModal();
        }
      }}
      variant="contained"
    >
      {t('worker.profile.addKYCInfoOnChain')}
    </Button>
  );
}
