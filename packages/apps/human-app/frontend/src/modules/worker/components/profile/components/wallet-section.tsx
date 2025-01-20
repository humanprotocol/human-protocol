import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { DoneLabel } from '@/modules/worker/components/profile/components/status-labels/done-label';
import { WalletConnectDone } from '@/modules/worker/components/profile/components/wallet-connect-done';
import type { WorkerProfileStatus } from '@/modules/worker/components/profile/types/profile-types';

interface WalletSectionProps {
  status: Pick<WorkerProfileStatus, 'kycApproved'>;
  isConnected: boolean;
  hasWalletAddress: boolean;
  isRegisterAddressPending: boolean;
  onConnect: () => void;
}

export function WalletSection({
  status,
  isConnected,
  hasWalletAddress,
  isRegisterAddressPending,
  onConnect,
}: WalletSectionProps) {
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
