import { Grid, Paper } from '@mui/material';
import { useEffect } from 'react';
import { t } from 'i18next';
import { colorPalette } from '@/styles/color-palette';
import { ProfileData } from '@/pages/worker/profile/profile-data';
import { ProfileActions } from '@/pages/worker/profile/profile-actions';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import type { UserData } from '@/auth/auth-context';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { useBackgroundColorStore } from '@/hooks/use-background-store';

const getNotificationMessage = (
  user: UserData & { isWalletConnected: boolean }
) => {
  switch (true) {
    case user.kyc_status !== 'APPROVED':
      return t('worker.profile.topNotifications.noKYC');
    case user.kyc_status === 'APPROVED' && !user.isWalletConnected:
      return t('worker.profile.topNotifications.noWalletConnected');
    default:
      return null;
  }
};

export function WorkerProfilePage() {
  const { user } = useAuthenticatedUser();
  const { isConnected } = useWalletConnect();
  const { setGrayBackground } = useBackgroundColorStore();
  const { setTopNotification: setTopNotificationInLayout } =
    useProtectedLayoutNotification();

  const setNotifications = () => {
    const notification = getNotificationMessage({
      ...user,
      isWalletConnected: isConnected,
    });
    if (notification) {
      setTopNotificationInLayout({ type: 'warning', content: notification });
    }
  };

  useEffect(() => {
    setNotifications();
    setGrayBackground();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this once
  }, []);

  return (
    <Paper
      sx={{
        backgroundColor: colorPalette.white,
        height: '100%',
        boxShadow: 'none',
        padding: '40px',
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
