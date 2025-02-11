import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { type WorkerProfileStatus } from '../types/profile-types';
import { DoneLabel } from './status-labels';
import { WalletConnectDone } from './wallet-connect-done';

interface WalletConnectionControlProps {
  status: Pick<WorkerProfileStatus, 'kycApproved'>;
  isConnected: boolean;
  hasWalletAddress: boolean;
  isRegisterAddressPending: boolean;
  onConnect: () => void;
}

export function WalletConnectionControl({
  status,
  isConnected,
  hasWalletAddress,
  isRegisterAddressPending,
  onConnect,
}: Readonly<WalletConnectionControlProps>) {
  const { t } = useTranslation();

  if (!status.kycApproved) {
    return (
      <Button disabled fullWidth variant="contained">
        {t('components.wallet.connectBtn.connect')}
      </Button>
    );
  }

  if (isConnected || hasWalletAddress) {
    return (
      <DoneLabel>
        <WalletConnectDone />
      </DoneLabel>
    );
  }

  return (
    <Button
      disabled={!status.kycApproved}
      fullWidth
      loading={isRegisterAddressPending}
      onClick={onConnect}
      variant="contained"
    >
      {t('components.wallet.connectBtn.connect')}
    </Button>
  );
}
