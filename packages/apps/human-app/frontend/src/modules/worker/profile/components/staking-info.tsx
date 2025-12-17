import { Button, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/shared/components/ui/chip';
import { env } from '@/shared/env';
import { useAddApiKeyModal } from '../hooks/use-api-key-modals';
import { ApiKeyData } from './';
import { useGetStakingSummary } from '../../hooks/use-staking';
import { RefreshIcon } from '@/shared/components/ui/icons';
import { useGetExchangeApiKeys } from '../../hooks/use-exchange-api-keys';

export function StakingInfo() {
  const { t } = useTranslation();
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
          disabled={isRefetching}
          sx={{ p: 0, bgcolor: 'rgba(20, 6, 178, 0.04)', borderRadius: '0px' }}
          onClick={() => (isRefetching ? undefined : refetch())}
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
