import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { WalletConnectDone } from '@/pages/worker/profile/wallet-connect-done';
import { StartKycButton } from '@/pages/worker/profile/start-kyc-btn';
import { RegisterAddressBtn } from '@/pages/worker/profile/register-address-btn';
import { DoneLabel } from '@/pages/worker/profile/done-label';
import { useRegisterAddressNotifications } from '@/hooks/use-register-address-notifications';
import { useRegisterAddressMutation } from '@/api/servieces/worker/use-register-address';
import { RegisterAddressOnChainButton } from '@/pages/worker/profile/register-address-on-chain-btn';

export function ProfileActions() {
  const {
    isConnected: isWalletConnected,
    address,
    openModal,
  } = useWalletConnect();
  const { onSuccess, onError } = useRegisterAddressNotifications();
  const {
    mutate: registerAddressMutation,
    isPending: isRegisterAddressMutationPending,
  } = useRegisterAddressMutation({
    onError,
    onSuccess,
  });
  const modalWasOpened = useRef(false);
  useEffect(() => {
    if (isWalletConnected && modalWasOpened.current) {
      registerAddressMutation();
    }
  }, [address, isWalletConnected, registerAddressMutation]);
  const { user } = useAuthenticatedUser();
  const { t } = useTranslation();
  const emailVerified = user.status === 'ACTIVE';
  const kycApproved = user.kyc_status === 'APPROVED';

  const getConnectWalletBtn = () => {
    switch (true) {
      case !kycApproved:
        return (
          <Button disabled fullWidth variant="contained">
            {t('components.wallet.connectBtn.connect')}
          </Button>
        );
      case !user.wallet_address && isWalletConnected:
      case Boolean(user.wallet_address):
        return (
          <DoneLabel>
            <WalletConnectDone />
          </DoneLabel>
        );
      case !user.wallet_address && !isWalletConnected:
        return (
          <Button
            disabled={user.kyc_status !== 'APPROVED'}
            fullWidth
            loading={isRegisterAddressMutationPending}
            onClick={() => {
              modalWasOpened.current = true;
              void openModal();
            }}
            variant="contained"
          >
            {t('components.wallet.connectBtn.connect')}
          </Button>
        );
      default:
        return null;
    }
  };

  if (!emailVerified) {
    return (
      <Navigate
        replace
        state={{ routerState: { email: user.email } }}
        to={routerPaths.worker.verifyEmail}
      />
    );
  }

  return (
    <Grid container flexDirection="column" gap="1rem">
      <Grid>
        {kycApproved ? (
          <DoneLabel>{t('worker.profile.kycCompleted')}</DoneLabel>
        ) : (
          <StartKycButton />
        )}
      </Grid>
      <Grid>{getConnectWalletBtn()}</Grid>
      {kycApproved && !user.wallet_address && isWalletConnected ? (
        <Grid>
          <RegisterAddressBtn />
        </Grid>
      ) : null}
      <Grid>
        {kycApproved && user.wallet_address ? (
          <RegisterAddressOnChainButton />
        ) : (
          <Button disabled fullWidth>
            {t('worker.profile.addKYCInfoOnChain')}
          </Button>
        )}
      </Grid>
    </Grid>
  );
}
