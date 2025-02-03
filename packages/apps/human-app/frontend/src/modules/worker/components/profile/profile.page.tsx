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
  const { isConnected } = useWalletConnect();
  const { showNotification } = useNotification();

  const setNotifications = () => {
    if (user.wallet_address) {
      return;
    }
    showNotification({
      type: TopNotificationType.WARNING,
      message: t('worker.profile.topNotifications.completeSteps'),
    });
  };

  useEffect(() => {
    setNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this once
  }, [isConnected]);

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
