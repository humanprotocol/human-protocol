import { Divider, IconButton, Stack, Typography } from '@mui/material';
import { t } from 'i18next';

import { RefreshIcon } from '@/shared/components/ui/icons';
import { useIsMobile } from '@/shared/hooks';
import { type HCaptchaUserStatsSuccess } from '../types';

type Props = {
  stats: HCaptchaUserStatsSuccess;
  refetch: () => void;
  isRefetching: boolean;
};

export function UserStatsDetails({ stats, refetch, isRefetching }: Props) {
  const isMobile = useIsMobile();

  return (
    <Stack>
      {!isMobile && (
        <Divider sx={{ height: '1px', bgcolor: 'border.strong' }} />
      )}
      <Stack sx={{ py: { xs: 2, md: 3 } }}>
        <Stack sx={{ gap: 2 }}>
          <Typography variant="h6">
            {t('worker.hcaptchaLabelingStats.allTime')}
          </Typography>
          <Stack
            direction="row"
            sx={{ flexWrap: 'wrap', gap: 2, justifyContent: 'space-between' }}
          >
            <Stack>
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.jobsServed')}
              </Typography>
              <Typography variant="h6" sx={{ color: 'text.light' }}>
                {stats.served}
              </Typography>
            </Stack>
            <Stack>
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.jobsComplete')}
              </Typography>
              <Typography variant="h6" sx={{ color: 'text.light' }}>
                {stats.solved}
              </Typography>
            </Stack>
            <Stack>
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.hmtEarned')}
              </Typography>
              <Typography variant="h6" sx={{ color: 'text.light' }}>
                {stats.balance.total}{' '}
                <Typography component="span" sx={{ color: 'text.primary' }}>
                  {t('inputMasks.humanCurrencySuffix')}
                </Typography>
              </Typography>
            </Stack>
          </Stack>
        </Stack>
        <Divider
          sx={{
            mt: { xs: 2, md: 3 },
            mb: 2,
            bgcolor: 'border.strong',
          }}
        />
        <Stack>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('worker.hcaptchaLabelingStats.lastHour')}
          </Typography>
          <Stack>
            <Typography variant="caption">
              {t('worker.hcaptchaLabelingStats.earnedLastHour')}
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.light' }}>
              {stats.balance.recent}{' '}
              <Typography component="span" sx={{ color: 'text.primary' }}>
                {t('inputMasks.humanCurrencySuffix')}
              </Typography>
            </Typography>
          </Stack>
        </Stack>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 3,
            gap: { xs: 1, md: 2 },
          }}
        >
          <Typography
            variant="body8"
            sx={{ lineHeight: '1.3', whiteSpace: 'pre-line' }}
          >
            {t('worker.hcaptchaLabelingStats.statisticsNotLive')}
          </Typography>
          <IconButton
            disabled={isRefetching}
            sx={{ p: 0 }}
            onClick={isRefetching ? undefined : refetch}
          >
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
}
