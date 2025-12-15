import { Button, Skeleton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/shared/components/ui/chip';
import { env } from '@/shared/env';
import { useAddApiKeyModal } from '../hooks/use-api-key-modals';
import { ApiKeyData } from '.';

export function StakingInfo() {
  const { t } = useTranslation();
  const { openModal: openAddApiKeyModal } = useAddApiKeyModal();

  const stakedAmount = 0;
  const isLoading = false;
  const isError = false;

  const isStaked = stakedAmount > 0;

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
      {!isStaked && (
        <Typography variant="body2" mt={1}>
          {t('worker.profile.stakingInfo.prompt')}
        </Typography>
      )}
      <Typography variant="buttonLarge" mt={2}>
        {t('worker.profile.stakingInfo.stakedAmount')}
      </Typography>
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
          sx={{ py: 0.5, px: '10px', bgcolor: 'primary.light' }}
          onClick={openAddApiKeyModal}
        >
          Connect API KEY
        </Button>
      </Stack>
      <ApiKeyData />
    </Stack>
  );
}
