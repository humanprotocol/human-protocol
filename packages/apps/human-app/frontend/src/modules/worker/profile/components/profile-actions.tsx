import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useWorkerProfileStatus } from '../hooks/use-worker-profile-status';
import { useWorkerWalletRegistration } from '../hooks/use-worker-wallet-registration';
import { RegisterAddressBtn } from './buttons';
import { KycVerificationControl } from './kyc-verification-control';
import { WalletConnectionControl } from './wallet-connection-control';

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
