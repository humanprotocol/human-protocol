import { Button, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/shared/components/ui/chip';
import { env } from '@/shared/env';
import { useAddApiKeyModal } from '../hooks/use-api-key-modals';
import { ApiKeyData } from './';
import { useGetStakingSummary } from '../../hooks/use-staking';
import { RefreshIcon } from '@/shared/components/ui/icons';
import { useGetExchangeApiKeys } from '../../hooks/use-exchange-api-keys';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useEffect, useRef } from 'react';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';

export function StakingInfo() {
  const { user } = useAuthenticatedUser();
  const { refreshAccessTokenAsync } = useAccessTokenRefresh();
  const { t } = useTranslation();
  const hasAttemptedRefresh = useRef(false);

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

  const isConnectButtonDisabled =
    !!exchangeApiKeyData?.exchange_name || isExchangeApiKeyLoading;

  const stakedAmount =
    Number(stakingSummary?.on_chain_stake || 0) +
    Number(stakingSummary?.exchange_stake || 0);

  const isStaked =
    stakedAmount >= Number(stakingSummary?.min_threshold || '1000');

  const isStakingError =
    !!stakingSummary?.on_chain_error ||
    !!stakingSummary?.exchange_error ||
    isError;

  useEffect(() => {
    if (isRefetching || isLoading) return;

    if (isStaked !== user.is_stake_eligible) {
      if (!hasAttemptedRefresh.current) {
        hasAttemptedRefresh.current = true;
        refreshAccessTokenAsync({ authType: 'web2' });
      }
    } else {
      hasAttemptedRefresh.current = false;
    }
  }, [
    isStaked,
    user.is_stake_eligible,
    refreshAccessTokenAsync,
    isRefetching,
    isLoading,
  ]);

  const handleRefreshStakingInfo = () => {
    if (isRefetching || isLoading) return;
    hasAttemptedRefresh.current = false;
    refetch();
  };

  return (
    <Stack>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="buttonLarge">
          {t('worker.profile.stakingInfo.stakeHmt')}
        </Typography>
        {isLoading ? (
          <Skeleton variant="text" width={100} height={24} />
        ) : (
          <Chip
            label={
              isStakingError
                ? t('worker.profile.stakingStatusValues.error')
                : isStaked
                  ? t('worker.profile.stakingStatusValues.staked')
                  : t('worker.profile.stakingStatusValues.notStaked')
            }
            backgroundColor={isStaked ? 'success.main' : 'error.main'}
          />
        )}
      </Stack>
      {!isStaked && (
        <Typography variant="body2" mt={1}>
          {t('worker.profile.stakingInfo.prompt', {
            amount: stakingSummary?.min_threshold || '1000',
          })}
        </Typography>
      )}
      <Stack direction="row" alignItems="center" mt={2} gap={1}>
        <Typography variant="buttonLarge">
          {t('worker.profile.stakingInfo.stakedAmount')}
        </Typography>
        <IconButton
          disabled={isRefetching || isLoading}
          sx={{ p: 0, bgcolor: 'rgba(20, 6, 178, 0.04)', borderRadius: '0px' }}
          onClick={handleRefreshStakingInfo}
        >
          <RefreshIcon />
        </IconButton>
      </Stack>
      <Typography
        variant="buttonLarge"
        color={isStaked ? 'primary.light' : 'error.main'}
      >
        <strong>{stakedAmount}</strong> HMT
      </Typography>
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
