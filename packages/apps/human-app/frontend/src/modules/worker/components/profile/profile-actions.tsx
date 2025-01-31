import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { WalletConnectDone } from '@/modules/worker/components/profile/wallet-connect-done';
import { StartKycButton } from '@/modules/worker/components/profile/start-kyc-btn';
import { RegisterAddressBtn } from '@/modules/worker/components/profile/register-address-btn';
import { DoneLabel } from '@/modules/worker/components/profile/done-label';
import { useRegisterAddressNotifications } from '@/modules/worker/hooks/use-register-address-notifications';
import { useRegisterAddressMutation } from '@/modules/worker/hooks/use-register-address';
import { ErrorLabel } from './error-label';

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
  const emailVerified = user.status === 'active';
  const kycApproved = user.kyc_status === 'approved';
  const kycDeclined = user.kyc_status === 'declined';
  const kycToComplete = !(kycApproved || kycDeclined);

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
            disabled={user.kyc_status !== 'approved'}
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
        {kycApproved && (
          <DoneLabel>{t('worker.profile.kycCompleted')}</DoneLabel>
        )}
        {kycDeclined && (
          <ErrorLabel>{t('worker.profile.kycDeclined')}</ErrorLabel>
        )}
        {kycToComplete && <StartKycButton />}
      </Grid>
      <Grid>{getConnectWalletBtn()}</Grid>
      {kycApproved && !user.wallet_address && isWalletConnected ? (
        <Grid>
          <RegisterAddressBtn />
        </Grid>
      ) : null}
      {kycApproved && !user.wallet_address ? (
        <Grid>{t('worker.profile.walletAddressMessage')}</Grid>
      ) : null}
    </Grid>
  );
}
