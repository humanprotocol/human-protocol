import { Paper, Stack } from '@mui/material';
import { useEffect } from 'react';
import { t } from 'i18next';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import {
  ProfileData,
  IdentityVerificationControl,
  WalletConnectionControl,
  StakingInfo,
} from '../components';
import { PageCardLoader } from '@/shared/components/ui/page-card/page-card-loader';
import { useUiConfig } from '@/shared/providers/ui-config-provider';

export function WorkerProfilePage() {
  const { user } = useAuthenticatedUser();
  const isMobile = useIsMobile();
  const { isConnected, initializing, web3ProviderMutation } =
    useWalletConnect();
  const { showNotification } = useNotification();
  const { uiConfig, isUiConfigLoading } = useUiConfig();

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

  if (isUiConfigLoading) {
    return <PageCardLoader />;
  }

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
      <Stack width="100%" maxWidth="450px" gap={3}>
        <ProfileData />
        <IdentityVerificationControl />
        <WalletConnectionControl />
        {!!user.wallet_address && uiConfig?.stakingEligibilityEnabled && (
          <StakingInfo />
        )}
      </Stack>
    </Paper>
  );
}
