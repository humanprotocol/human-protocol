import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { t } from 'i18next';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import { ProfileData } from '../components/profile-data';
import {
  CheckmarkIcon,
  CopyIcon,
  LogoutIcon,
} from '@/shared/components/ui/icons';
import { shortenEscrowAddress } from '@/shared/helpers/evm';
import { Button } from '@/shared/components/ui/button';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { routerPaths } from '@/router/router-paths';
import { BackButton } from '@/shared/components/ui/page-card/back-button';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

export function WorkerProfilePage() {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuthenticatedUser();
  const { colorPalette } = useColorMode();
  const { isConnected, initializing, web3ProviderMutation } =
    useWalletConnect();
  const { showNotification } = useNotification();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(routerPaths.worker.jobsDiscovery);
  };

  const handleCopyClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (isCopied) return;

    e.stopPropagation();
    navigator.clipboard.writeText(user.wallet_address ?? '');
    setIsCopied(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };

  const handleSignOut = () => {
    browserAuthProvider.signOut({
      callback: () => {
        window.location.reload();
      },
    });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

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
    <Stack sx={{ px: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: { xs: 2.5, md: 5 },
        }}
      >
        {isMobile && <BackButton onClick={handleBack} />}
        <Typography
          component="h1"
          variant="h5"
          sx={{
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 'normal',
            letterSpacing: '0.12px',
            color: {
              xs: colorPalette.text.auxiliary100,
              md: colorPalette.text.primary,
            },
          }}
        >
          {t('worker.profile.profileHeader')}
        </Typography>
      </Box>

      <Stack
        sx={{
          borderRadius: '20px',
          border: `1px solid ${colorPalette.border.strong}`,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            py: 2,
            px: { xs: 2, md: 3 },
            gap: 2,
            borderBottom: `1px solid ${colorPalette.border.strong}`,
          }}
        >
          <ProfileData variant="expanded" />
          <Typography
            sx={{
              display: 'flex',
              flexShrink: 0,
              alignItems: 'center',
              gap: { xs: 0.5, md: 1 },
              fontSize: { xs: 12, md: 14 },
              fontWeight: 500,
              lineHeight: 'normal',
              letterSpacing: '0.12px',
              color: colorPalette.success.main,
            }}
          >
            <CheckmarkIcon />
            {t('worker.profile.accountVerified')}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 4, md: 3 },
            p: { xs: 2, md: 3 },
          }}
        >
          <Stack sx={{ gap: { xs: 3, md: 4 } }}>
            <Stack sx={{ gap: 1 }}>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 'normal',
                  color: colorPalette.text.auxiliary200,
                }}
              >
                {t('worker.profile.email')}
              </Typography>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: 'normal',
                  color: colorPalette.text.primary,
                }}
              >
                {user.email}
              </Typography>
            </Stack>
            <Stack sx={{ gap: 1 }}>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 'normal',
                  color: colorPalette.text.auxiliary200,
                }}
              >
                {t('worker.profile.walletAddress')}
              </Typography>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: 'normal',
                  color: colorPalette.text.primary,
                }}
              >
                {shortenEscrowAddress(user.wallet_address ?? '', 9, 8)}
                <Tooltip
                  title={t('components.copyToClipboard')}
                  open={isCopied}
                  placement="top"
                >
                  <IconButton
                    onClick={handleCopyClick}
                    disabled={isCopied}
                    disableRipple
                    sx={{ p: 0, ml: 1, '& svg': { width: 16, height: 16 } }}
                  >
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              </Typography>
            </Stack>
          </Stack>
          <Stack
            direction={{ xs: 'row', md: 'column' }}
            sx={{ gap: 2, width: { xs: '100%', md: '150px' } }}
          >
            <Button
              variant="contained"
              color="error"
              fullWidth
              startIcon={<LogoutIcon />}
              onClick={handleSignOut}
            >
              {t('worker.profile.logout')}
            </Button>
            <Button
              component={Link}
              to={routerPaths.worker.sendResetLink}
              variant="outlined"
              fullWidth
            >
              {t('worker.profile.resetPassword')}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}
