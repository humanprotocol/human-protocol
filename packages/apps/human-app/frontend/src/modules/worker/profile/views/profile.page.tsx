import { Grid, Paper } from '@mui/material';
import { useEffect } from 'react';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { routerPaths } from '@/router/router-paths';
import { ProfileData, ProfileActions } from '../components';

export function WorkerProfilePage() {
  const { user } = useAuthenticatedUser();
  const isMobile = useIsMobile();
  const { isConnected, initializing, web3ProviderMutation } =
    useWalletConnect();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const emailVerified = user.status === 'active';

  useEffect(() => {
    if (!emailVerified) {
      navigate(routerPaths.worker.verifyEmail, {
        replace: true,
        state: { routerState: { email: user.email } },
      });
    }
  }, [navigate, user.email, emailVerified]);

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
      </Grid>
    </Paper>
  );
}
