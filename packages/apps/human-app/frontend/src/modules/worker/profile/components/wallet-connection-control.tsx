import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { DoneLabel } from './status-labels';
import { WalletConnectDone } from './wallet-connect-done';

interface WalletConnectionControlProps {
  kycApproved: boolean;
  isConnected: boolean;
  hasWalletAddress: boolean;
  isRegisterAddressPending: boolean;
  onConnect: () => void;
}

export function WalletConnectionControl({
  kycApproved,
  isConnected,
  hasWalletAddress,
  isRegisterAddressPending,
  onConnect,
}: Readonly<WalletConnectionControlProps>) {
  const { t } = useTranslation();

  if (isConnected || hasWalletAddress) {
    return (
      <DoneLabel>
        <WalletConnectDone />
      </DoneLabel>
    );
  }

  return (
    <Button
      disabled={kycApproved}
      fullWidth
      loading={isRegisterAddressPending}
      onClick={onConnect}
      variant="contained"
    >
      {t('components.wallet.connectBtn.connect')}
    </Button>
  );
}
