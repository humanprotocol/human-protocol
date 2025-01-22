import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { KycVerificationControl } from '@/modules/worker/components/profile/components/kyc-verification-control';
import { WalletConnectionControl } from '@/modules/worker/components/profile/components/wallet-connection-control';
import { useWorkerProfileStatus } from '@/modules/worker/components/profile/hooks/use-worker-profile-status';
import { useWorkerWalletRegistration } from '@/modules/worker/components/profile/hooks/use-worker-wallet-registration';
import { RegisterAddressBtn } from '@/modules/worker/components/profile/components/buttons/register-address-btn';

export function ProfileActions() {
  const { t } = useTranslation();
  const { user } = useAuthenticatedUser();
  const status = useWorkerProfileStatus();
  const { isConnected, isRegisterAddressPending, handleConnectWallet } =
    useWorkerWalletRegistration();

  return (
    <Grid container flexDirection="column" gap="1rem">
      <Grid>
        <KycVerificationControl status={status} />
      </Grid>

      <Grid>
        <WalletConnectionControl
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
