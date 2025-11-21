import { useTranslation } from 'react-i18next';
import { Grid } from '@mui/material';
import { Button } from '@/shared/components/ui/button';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { useWorkerIdentityVerificationStatus } from '../hooks';
import { WalletConnectDone } from './wallet-connect-done';
import { RegisterAddressBtn } from './buttons';

export function WalletConnectionControl() {
  const { t } = useTranslation();
  const { user } = useAuthenticatedUser();
  const { isVerificationCompleted } = useWorkerIdentityVerificationStatus();
  const { isConnected, openModal } = useWalletConnect();

  const { wallet_address: walletAddress } = user;
  const hasWalletAddress = Boolean(walletAddress);

  if (hasWalletAddress) {
    return <WalletConnectDone />;
  }

  if (isVerificationCompleted && isConnected) {
    return (
      <Grid>
        <RegisterAddressBtn />
        <Grid>{t('worker.profile.walletAddressMessage')}</Grid>
      </Grid>
    );
  }

  return (
    <Button
      disabled={!isVerificationCompleted}
      fullWidth
      onClick={() => void openModal()}
      variant="contained"
    >
      {t('components.wallet.connectBtn.connect')}
    </Button>
  );
}
