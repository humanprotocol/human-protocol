import { Grid, Paper } from '@mui/material';
import { useEffect } from 'react';
import { t } from 'i18next';
import { colorPalette } from '@/styles/color-palette';
import { ProfileData } from '@/pages/worker/profile/profile-data';
import { ProfileActions } from '@/pages/worker/profile/profile-actions';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';

export function WorkerProfilePage() {
  const { user } = useAuthenticatedUser();
  const isMobile = useIsMobile();
  const { isConnected } = useWalletConnect();
  const { setGrayBackground } = useBackgroundColorStore();
  const { setTopNotification: setTopNotificationInLayout } =
    useProtectedLayoutNotification();

  const setNotifications = () => {
    if (user.wallet_address) {
      return;
    }
    setTopNotificationInLayout({
      type: 'warning',
      content: t('worker.profile.topNotifications.completeSteps'),
    });
  };

  useEffect(() => {
    setNotifications();
    setGrayBackground();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this once
  }, [isConnected]);

  return (
    <Paper
      sx={{
        backgroundColor: colorPalette.white,
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
