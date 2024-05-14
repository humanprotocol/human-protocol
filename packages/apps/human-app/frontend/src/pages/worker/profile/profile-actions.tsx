import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import { useEffect } from 'react';
import { ProfileAction } from '@/pages/worker/profile/profile-action';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { ConnectWalletBtn } from '@/components/ui/connect-wallet-btn';

export function ProfileActions({
  setNotifications,
}: {
  setNotifications: () => void;
}) {
  const { user } = useAuthenticatedUser();
  const { t } = useTranslation();
  const { isConnected: isWalletConnected } = useWalletConnect();

  useEffect(() => {
    setNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- correct dependency
  }, [isWalletConnected]);

  return (
    <Grid container flexDirection="column" gap="1rem">
      <Grid>
        <ProfileAction
          done={user.kyc_status === 'APPROVED'}
          doneLabel={t('worker.profile.kycCompleted')}
          toDoComponent={
            <Button fullWidth variant="contained">
              {t('worker.profile.completeKYC')}
            </Button>
          }
        />
      </Grid>
      <Grid>
        <ProfileAction
          done={isWalletConnected}
          doneLabel={t('worker.profile.walletConnected')}
          toDoComponent={
            <ConnectWalletBtn
              disabled={user.kyc_status !== 'APPROVED'}
              fullWidth
              variant="contained"
            >
              {t('worker.profile.connectWallet')}
            </ConnectWalletBtn>
          }
        />
      </Grid>
      <Grid>
        <ProfileAction
          done={Boolean(user.kyc_added_on_chain)}
          doneLabel={t('worker.profile.kycInfoOnChainAdded')}
          toDoComponent={
            <Button
              disabled={!isWalletConnected || user.kyc_status === 'APPROVED'}
              fullWidth
              variant="contained"
            >
              {t('worker.profile.addKYCInfoOnChain')}
            </Button>
          }
        />
      </Grid>
    </Grid>
  );
}
