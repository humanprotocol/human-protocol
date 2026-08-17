import { useTranslation } from 'react-i18next';
import { Stack, Typography } from '@mui/material';

import { RegisterAddressBtn } from './register-address-btn';
import { Button } from '@/shared/components/ui/button';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { useAuth } from '@/modules/auth/hooks/use-auth';

export function WalletConnectionControl() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isConnected, openModal } = useWalletConnect();

  const hasWalletAddress = !!user?.wallet_address;

  if (isConnected && !hasWalletAddress) {
    return (
      <Stack sx={{ gap: 2 }}>
        <RegisterAddressBtn />
        <Typography sx={{ color: 'text.auxiliary100' }}>
          {t('worker.profile.walletAddressMessage')}
        </Typography>
      </Stack>
    );
  }

  return (
    <Button
      variant="contained"
      color="accent"
      fullWidth
      onClick={() => void openModal()}
    >
      {t('components.wallet.connectBtn.connect')}
    </Button>
  );
}
