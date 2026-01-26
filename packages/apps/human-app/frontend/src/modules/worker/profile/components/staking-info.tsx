import {
  Button,
  IconButton,
  Link,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/shared/components/ui/chip';
import { env } from '@/shared/env';
import { useAddApiKeyModal } from '../hooks/use-api-key-modals';
import { ApiKeyData } from './';
import { useGetStakingSummary } from '../../hooks/use-staking';
import { RefreshIcon } from '@/shared/components/ui/icons';
import { useGetExchangeApiKeys } from '../../hooks/use-exchange-api-keys';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useEffect, useRef, useState } from 'react';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';
import { colorPalette } from '@/shared/styles/color-palette';
import { useGetUiConfig } from '@/shared/hooks/use-get-ui-config';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';

export function StakingInfo() {
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const tokenRefreshLock = useRef(false);

  const { user, updateUserData } = useAuthenticatedUser();
  const { refreshAccessTokenAsync } = useAccessTokenRefresh();
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const { openModal: openAddApiKeyModal } = useAddApiKeyModal();
  const { data: exchangeApiKeyData, isLoading: isExchangeApiKeyLoading } =
    useGetExchangeApiKeys();
  const {
    data: stakingSummary,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGetStakingSummary();
  const { data: uiConfig, isLoading: isUiConfigLoading } = useGetUiConfig();

  const isConnectButtonDisabled =
    !!exchangeApiKeyData?.exchange_name || isExchangeApiKeyLoading;

  const stakedAmount =
    Number(stakingSummary?.on_chain_stake || 0) +
    Number(stakingSummary?.exchange_stake || 0);

  const isStaked =
    isLoading || isError || isUiConfigLoading
      ? false
      : stakedAmount >= Number(uiConfig?.minThreshold || '0');

  useEffect(() => {
    const stakingSummaryError =
      stakingSummary?.on_chain_error || stakingSummary?.exchange_error;
    if (stakingSummaryError && !isLoading && !isRefetching) {
      showNotification({
        type: TopNotificationType.WARNING,
        message: stakingSummaryError,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoading,
    isRefetching,
    stakingSummary?.on_chain_error,
    stakingSummary?.exchange_error,
  ]);

  useEffect(() => {
    if (isRefetching || isLoading) return;

    if (isStaked !== user.is_stake_eligible) {
      if (!tokenRefreshLock.current) {
        tokenRefreshLock.current = true;
        updateUserData({ is_stake_eligible: isStaked });
        void refreshAccessTokenAsync({ authType: 'web2' });
      }
    } else {
      tokenRefreshLock.current = false;
    }
  }, [
    isStaked,
    user.is_stake_eligible,
    refreshAccessTokenAsync,
    isRefetching,
    isLoading,
    updateUserData,
  ]);

  const handleRefreshStakingInfo = () => {
    if (isRefetching || isLoading) return;
    tokenRefreshLock.current = false;
    refetch();
  };

  return (
    <Stack>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="buttonLarge">
          {t('worker.profile.stakingInfo.stakeHmt')}
        </Typography>
        {isLoading || isRefetching ? (
          <Skeleton variant="text" width={100} height={23.5} />
        ) : (
          <Chip
            label={
              isError
                ? t('worker.profile.stakingStatusValues.error')
                : isStaked
                  ? t('worker.profile.stakingStatusValues.staked')
                  : t('worker.profile.stakingStatusValues.notStaked')
            }
            backgroundColor={isStaked ? 'success.main' : 'error.main'}
          />
        )}
      </Stack>
      <Typography variant="body2" mt={1}>
        {isPromptExpanded
          ? t('worker.profile.stakingInfo.prompt', {
              amount: uiConfig?.minThreshold,
            })
          : t('worker.profile.stakingInfo.promptShort')}{' '}
        {isPromptExpanded && (
          <>
            <br />
            <Link
              href="https://docs.humanprotocol.org/tutorials/workers/staking/#how-to-create-api-keys"
              sx={{
                textDecoration: 'underline',
                fontWeight: '600',
              }}
              target="_blank"
            >
              {t('worker.profile.stakingInfo.howToCreateApiKeys')}
            </Link>
            <br />
          </>
        )}
        <Button
          variant="text"
          size="small"
          disableRipple
          sx={{
            p: 0,
            minWidth: 'auto',
            verticalAlign: 'baseline',
            height: '20px',
            textDecoration: 'underline',
            '&:hover': {
              textDecoration: 'underline',
              backgroundColor: 'transparent',
            },
          }}
          onClick={() => setIsPromptExpanded((prev) => !prev)}
        >
          {isPromptExpanded
            ? t('worker.profile.stakingInfo.readLess')
            : t('worker.profile.stakingInfo.readMore')}
        </Button>
      </Typography>
      <Stack direction="row" alignItems="center" mt={2} gap={1}>
        <Typography variant="buttonLarge">
          {t('worker.profile.stakingInfo.stakedAmount')}
        </Typography>
        <IconButton
          disabled={isRefetching || isLoading}
          sx={{
            p: 0,
            bgcolor: 'rgba(20, 6, 178, 0.04)',
            borderRadius: '0px',
            '& > svg > path': {
              fill:
                isRefetching || isLoading
                  ? colorPalette.button.disabled
                  : 'primary.main',
            },
          }}
          onClick={handleRefreshStakingInfo}
        >
          <RefreshIcon />
        </IconButton>
      </Stack>
      {isLoading || isRefetching ? (
        <Skeleton variant="text" width={100} height={22.5} />
      ) : (
        <Typography
          variant="buttonLarge"
          color={isStaked ? 'primary.light' : 'error.main'}
        >
          <strong>{stakedAmount}</strong> HMT
        </Typography>
      )}
      <Stack direction="row" gap={2} mt={2} mb={3}>
        <Button
          variant="contained"
          size="small"
          sx={{ py: 0.5, px: '10px' }}
          onClick={() => window.open(env.VITE_STAKING_DASHBOARD_URL, '_blank')}
        >
          Add staking
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={isConnectButtonDisabled}
          sx={{ py: 0.5, px: '10px', bgcolor: 'primary.light' }}
          onClick={() =>
            isConnectButtonDisabled ? undefined : openAddApiKeyModal()
          }
        >
          Connect API KEY
        </Button>
      </Stack>
      <ApiKeyData />
    </Stack>
  );
}
