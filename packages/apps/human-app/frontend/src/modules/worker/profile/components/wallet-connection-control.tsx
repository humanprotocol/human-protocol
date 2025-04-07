import { useTranslation } from 'react-i18next';
import { Grid } from '@mui/material';
import { Button } from '@/shared/components/ui/button';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { useWorkerKycStatus } from '../hooks';
import { DoneLabel } from './status-labels';
import { WalletConnectDone } from './wallet-connect-done';
import { RegisterAddressBtn } from './buttons';

export function WalletConnectionControl() {
  const { t } = useTranslation();
  const { user } = useAuthenticatedUser();
  const { kycApproved } = useWorkerKycStatus();
  const { isConnected, openModal } = useWalletConnect();

  const { wallet_address: walletAddress } = user;
  const hasWalletAddress = Boolean(walletAddress);

  if (hasWalletAddress) {
    return (
      <DoneLabel>
        <WalletConnectDone />
      </DoneLabel>
    );
  }

  if (kycApproved && isConnected) {
    return (
      <Grid>
        <RegisterAddressBtn />
        <Grid>{t('worker.profile.walletAddressMessage')}</Grid>
      </Grid>
    );
  }

  return (
    <Button
      disabled={!kycApproved}
      fullWidth
      onClick={() => void openModal()}
      variant="contained"
    >
      {t('components.wallet.connectBtn.connect')}
    </Button>
  );
}
