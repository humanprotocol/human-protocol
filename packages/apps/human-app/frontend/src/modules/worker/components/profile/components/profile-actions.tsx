import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { KycStatus } from '@/modules/worker/components/profile/components/kyc-status';
import { WalletSection } from '@/modules/worker/components/profile/components/wallet-section';
import { useProfileStatus } from '@/modules/worker/components/profile/hooks/use-profile-status';
import { useWalletActions } from '@/modules/worker/components/profile/hooks/use-wallet-actions';
import { RegisterAddressBtn } from '@/modules/worker/components/profile/components/buttons/register-address-btn';

export function ProfileActions() {
  const { t } = useTranslation();
  const { user } = useAuthenticatedUser();
  const status = useProfileStatus();
  const { isConnected, isRegisterAddressPending, handleConnectWallet } =
    useWalletActions();

  return (
    <Grid container flexDirection="column" gap="1rem">
      <Grid>
        <KycStatus status={status} />
      </Grid>

      <Grid>
        <WalletSection
          status={status}
          isConnected={isConnected}
          hasWalletAddress={Boolean(user.wallet_address)}
          isRegisterAddressPending={isRegisterAddressPending}
          onConnect={handleConnectWallet}
        />
      </Grid>

      {status.kycApproved && !user.wallet_address && (
        <>
          {isConnected && (
            <Grid>
              <RegisterAddressBtn />
            </Grid>
          )}
          <Grid>{t('worker.profile.walletAddressMessage')}</Grid>
        </>
      )}
    </Grid>
  );
}
