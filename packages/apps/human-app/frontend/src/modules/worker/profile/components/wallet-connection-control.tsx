import { useTranslation } from 'react-i18next';
import { Stack, Typography } from '@mui/material';
import { Button } from '@/shared/components/ui/button';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { RegisterAddressBtn } from './buttons/register-address-btn';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useColorMode } from '@/shared/contexts/color-mode';

export function WalletConnectionControl() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isConnected, openModal } = useWalletConnect();
  const { colorPalette } = useColorMode();

  const hasWalletAddress = !!user?.wallet_address;

  if (isConnected && !hasWalletAddress) {
    return (
      <Stack sx={{ gap: 2 }}>
        <RegisterAddressBtn />
        <Typography sx={{ color: colorPalette.text.auxiliary100 }}>
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
