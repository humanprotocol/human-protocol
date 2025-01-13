import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { routerPaths } from '@/router/router-paths';
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

  if (!status.emailVerified) {
    return (
      <Navigate
        replace
        state={{ routerState: { email: user.email } }}
        to={routerPaths.worker.verifyEmail}
      />
    );
  }

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
