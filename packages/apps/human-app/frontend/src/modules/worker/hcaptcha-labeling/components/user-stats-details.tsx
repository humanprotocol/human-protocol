import { Divider, IconButton, Stack, Typography } from '@mui/material';
import { t } from 'i18next';
import { RefreshIcon } from '@/shared/components/ui/icons';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useIsMobile } from '@/shared/hooks';
import { type HCaptchaUserStatsSuccess } from '../types';

export function UserStatsDetails({
  stats,
  refetch,
  isRefetching,
}: Readonly<{
  stats: HCaptchaUserStatsSuccess;
  refetch: () => void;
  isRefetching: boolean;
}>) {
  const { colorPalette, isDarkMode } = useColorMode();
  const isMobile = useIsMobile();

  const statsColor = isDarkMode
    ? onlyDarkModeColor.additionalTextColor
    : colorPalette.primary.light;

  return (
    <Stack>
      <Divider sx={{ borderBottomWidth: '2px' }} />
      <Stack sx={{ py: 3 }}>
        <Stack sx={{ gap: { xs: 3, md: 2 } }}>
          <Typography variant={isMobile ? 'mobileHeaderLarge' : 'body7'}>
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
              <Typography variant="h6" sx={{ color: statsColor }}>
                {stats.served}
              </Typography>
            </Stack>
            <Stack>
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.jobsComplete')}
              </Typography>
              <Typography variant="h6" sx={{ color: statsColor }}>
                {stats.solved}
              </Typography>
            </Stack>
            <Stack>
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.hmtEarned')}
              </Typography>
              <Typography variant="h6" sx={{ color: statsColor }}>
                {stats.balance.total}{' '}
                <span style={{ color: colorPalette.text.primary }}>
                  {t('inputMasks.humanCurrencySuffix')}
                </span>
              </Typography>
            </Stack>
          </Stack>
        </Stack>
        <Divider sx={{ mt: { xs: 2, md: 3 }, mb: { xs: 4, md: 2 } }} />
        <Stack>
          <Typography variant="body7" sx={{ mb: { xs: 3, md: 2 } }}>
            {t('worker.hcaptchaLabelingStats.lastHour')}
          </Typography>
          <Stack>
            <Typography variant="caption">
              {t('worker.hcaptchaLabelingStats.earnedLastHour')}
            </Typography>
            <Typography variant="h6" sx={{ color: statsColor }}>
              {stats.balance.recent}{' '}
              <span style={{ color: colorPalette.text.primary }}>
                {t('inputMasks.humanCurrencySuffix')}
              </span>
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
