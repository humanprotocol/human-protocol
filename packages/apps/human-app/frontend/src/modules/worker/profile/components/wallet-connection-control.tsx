import { useTranslation } from 'react-i18next';
import { Grid } from '@mui/material';
import { Button } from '@/shared/components/ui/button';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useWorkerProfileStatus, useWorkerWalletRegistration } from '../hooks';
import { DoneLabel } from './status-labels';
import { WalletConnectDone } from './wallet-connect-done';
import { RegisterAddressBtn } from './buttons';

export function WalletConnectionControl() {
  const { t } = useTranslation();
  const { user } = useAuthenticatedUser();
  const { kycApproved } = useWorkerProfileStatus();
  const { isConnected, isRegisterAddressPending, handleConnectWallet } =
    useWorkerWalletRegistration();

  const { wallet_address: walletAddress } = user;
  const hasWalletAddress = Boolean(walletAddress);

  if (hasWalletAddress) {
    return (
      <DoneLabel>
        <WalletConnectDone />
      </DoneLabel>
    );
  }

  if (!isConnected) {
    return (
      <Button
        disabled={!kycApproved}
        fullWidth
        loading={isRegisterAddressPending}
        onClick={handleConnectWallet}
        variant="contained"
      >
        {t('components.wallet.connectBtn.connect')}
      </Button>
    );
  }

  if (kycApproved) {
    return (
      <Grid>
        <RegisterAddressBtn />
        <Grid>{t('worker.profile.walletAddressMessage')}</Grid>
      </Grid>
    );
  }
}
