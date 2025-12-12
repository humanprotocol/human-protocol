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
      <Stack py={3}>
        <Stack gap={{ xs: 3, md: 2 }}>
          <Typography variant={isMobile ? 'mobileHeaderLarge' : 'body7'}>
            {t('worker.hcaptchaLabelingStats.allTime')}
          </Typography>
          <Stack
            direction="row"
            flexWrap="wrap"
            gap="1rem"
            justifyContent="space-between"
          >
            <Stack>
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.jobsServed')}
              </Typography>
              <Typography color={statsColor} variant="h6">
                {stats.served}
              </Typography>
            </Stack>
            <Stack>
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.jobsComplete')}
              </Typography>
              <Typography color={statsColor} variant="h6">
                {stats.solved}
              </Typography>
            </Stack>
            <Stack>
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.hmtEarned')}
              </Typography>
              <Typography color={statsColor} variant="h6">
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
          <Typography variant="body7" mb={{ xs: 3, md: 2 }}>
            {t('worker.hcaptchaLabelingStats.lastHour')}
          </Typography>
          <Stack>
            <Typography variant="caption">
              {t('worker.hcaptchaLabelingStats.earnedLastHour')}
            </Typography>
            <Typography color={statsColor} variant="h6">
              {stats.balance.recent}{' '}
              <span style={{ color: colorPalette.text.primary }}>
                {t('inputMasks.humanCurrencySuffix')}
              </span>
            </Typography>
          </Stack>
        </Stack>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mt={3}
          gap={{ xs: 1, md: 2 }}
        >
          <Typography
            variant="body8"
            lineHeight="1.3"
            sx={{ whiteSpace: 'pre-line' }}
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
