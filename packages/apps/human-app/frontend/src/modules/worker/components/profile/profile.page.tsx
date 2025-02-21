import { Grid, Paper } from '@mui/material';
import { useEffect } from 'react';
import { t } from 'i18next';
import { ProfileData } from '@/modules/worker/components/profile/profile-data';
import { ProfileActions } from '@/modules/worker/components/profile/profile-actions';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';

export function WorkerProfilePage() {
  const { user } = useAuthenticatedUser();
  const isMobile = useIsMobile();
  const { isConnected, initializing, web3ProviderMutation } =
    useWalletConnect();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (initializing) return;

    if (!isConnected || !user.wallet_address) {
      showNotification({
        type: TopNotificationType.WARNING,
        message: t('worker.profile.topNotifications.completeSteps'),
      });
    }

    if (web3ProviderMutation.isError && web3ProviderMutation.failureReason) {
      showNotification({
        type: TopNotificationType.WARNING,
        message: web3ProviderMutation.failureReason.message,
      });
    }
  }, [
    isConnected,
    initializing,
    web3ProviderMutation.failureReason,
    web3ProviderMutation.isError,
    user.wallet_address,
    showNotification,
  ]);

  return (
    <Paper
      sx={{
        height: '100%',
        boxShadow: 'none',
        padding: isMobile ? '60px 20px' : '100px 40px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Grid
        container
        sx={{
          maxWidth: '376px',
          gap: '3rem',
        }}
      >
        <ProfileData />
        <ProfileActions />
        {/* TODO add email notifications toggling */}
        {/* <ProfileEmailNotification /> */}
      </Grid>
    </Paper>
  );
}
