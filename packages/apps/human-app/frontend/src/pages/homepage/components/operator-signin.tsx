import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { PrepareSignatureType } from '@/api/servieces/operator/prepare-signature';
import { useWeb3SignIn } from '@/api/servieces/operator/web3-signin';

export function OperatorSignIn() {
  const { isConnected, openModal, address } = useWalletConnect();
  const { mutate: signInMutation } = useWeb3SignIn();
  const modalWasOpened = useRef(false);

  useEffect(() => {
    if (isConnected && modalWasOpened.current) {
      signInMutation({ address, type: PrepareSignatureType.SignIn });
    }
  }, [address, isConnected, signInMutation]);

  if (!isConnected) {
    return (
      <Button
        fullWidth
        onClick={() => {
          modalWasOpened.current = true;
          void openModal();
        }}
        size="large"
        variant="outlined"
      >
        {t('homepage.operatorSignIn')}
      </Button>
    );
  }
  return (
    <Button
      fullWidth
      onClick={() => {
        signInMutation({ address, type: PrepareSignatureType.SignIn });
      }}
      size="large"
      variant="outlined"
    >
      {t('homepage.operatorSignIn')}
    </Button>
  );
}
