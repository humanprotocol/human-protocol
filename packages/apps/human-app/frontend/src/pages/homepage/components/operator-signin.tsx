import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import { Button } from '@/components/ui/button';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { PrepareSignatureType } from '@/api/servieces/operator/prepare-signature';
import { useWeb3SignIn } from '@/api/servieces/operator/web3-signin';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';
import { routerPaths } from '@/router/router-paths';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { jsonRpcErrorHandler } from '@/shared/helpers/json-rpc-error-handler';

export function OperatorSignIn() {
  const { isConnected, openModal, address } = useWalletConnect();
  const {
    mutate: signInMutation,
    isError: isSignInMutationError,
    error: signInMutationError,
  } = useWeb3SignIn();
  const { user } = useWeb3Auth();
  const modalWasOpened = useRef(false);

  useEffect(() => {
    if (isConnected && modalWasOpened.current) {
      signInMutation({ address, type: PrepareSignatureType.SignIn });
    }
  }, [address, isConnected, signInMutation]);

  const getSnackBar = () => {
    return (
      <Snackbar
        message={defaultErrorMessage(signInMutationError, jsonRpcErrorHandler)}
        open={isSignInMutationError}
      />
    );
  };

  if (user) {
    return (
      <>
        <Button
          component={Link}
          fullWidth
          size="large"
          to={routerPaths.operator.profile}
          variant="outlined"
        >
          {t('homepage.operatorSignIn')}
        </Button>
        {getSnackBar()}
      </>
    );
  }

  if (!isConnected) {
    return (
      <>
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
        {getSnackBar()}
      </>
    );
  }

  return (
    <>
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
      {getSnackBar()}
    </>
  );
}
