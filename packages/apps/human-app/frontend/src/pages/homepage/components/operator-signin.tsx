import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { PrepareSignatureType } from '@/api/servieces/operator/prepare-signature';
import { useWeb3SignIn } from '@/api/servieces/operator/web3-signin';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';
import { routerPaths } from '@/router/router-paths';

export function OperatorSignIn() {
  const { isConnected, openModal, address } = useWalletConnect();
  const { mutate: signInMutation } = useWeb3SignIn();
  const { user } = useWeb3Auth();
  const modalWasOpened = useRef(false);

  useEffect(() => {
    if (isConnected && modalWasOpened.current) {
      signInMutation({ address, type: PrepareSignatureType.SignIn });
    }
  }, [address, isConnected, signInMutation]);

  if (user) {
    return (
      <Button
        component={Link}
        fullWidth
        size="large"
        to={routerPaths.operator.profile}
        variant="outlined"
      >
        {t('homepage.operatorSignIn')}
      </Button>
    );
  }

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
