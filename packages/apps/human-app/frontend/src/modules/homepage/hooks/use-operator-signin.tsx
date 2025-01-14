import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import { Button } from '@/shared/components/ui/button';
import { useWalletConnect } from '@/shared/hooks/use-wallet-connect';
import { useWeb3SignIn } from '@/modules/operator/hooks/use-web3-signin';
import { useWeb3Auth } from '@/modules/auth-web3/hooks/use-web3-auth';
import { routerPaths } from '@/router/router-paths';
import { getErrorMessageForError } from '@/shared/errors';
import { PrepareSignatureType } from '@/api/hooks/use-prepare-signature';

export function OperatorSignIn() {
  const { isConnected, openModal, address } = useWalletConnect();
  const {
    mutate: signInMutation,
    isError: isSignInMutationError,
    error: signInMutationError,
  } = useWeb3SignIn();
  const { user, signOut } = useWeb3Auth();
  const modalWasOpened = useRef(false);

  useEffect(() => {
    if (isConnected && modalWasOpened.current) {
      signInMutation({ address, type: PrepareSignatureType.SignIn });
    }
  }, [address, isConnected, signInMutation]);

  const getSnackBar = () => {
    return (
      <Snackbar
        message={getErrorMessageForError(signInMutationError)}
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
            signOut();
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
