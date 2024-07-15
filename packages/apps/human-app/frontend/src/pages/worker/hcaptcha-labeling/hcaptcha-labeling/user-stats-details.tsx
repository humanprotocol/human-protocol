import { Divider, Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import { colorPalette } from '@/styles/color-palette';
import { RefreshIcon } from '@/components/ui/icons';
import type { HCaptchaUserStatsSuccess } from '@/api/servieces/worker/hcaptcha-user-stats';

export function UserStatsDetails({
  stats,
  refetch,
}: {
  stats: HCaptchaUserStatsSuccess;
  refetch: () => void;
}) {
  return (
    <Grid>
      <Divider sx={{ borderBottomWidth: '2px' }} />
      <Grid
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem 0',
          gap: '1rem',
        }}
      >
        <Grid sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Typography variant="body7">
            {t('worker.hcaptchaLabelingStats.allTime')}
          </Typography>
          <Grid container gap="1rem" justifyContent="space-between">
            <Grid
              sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.jobsServed')}
              </Typography>
              <Typography color={colorPalette.primary.light} variant="h6">
                {stats.served}
              </Typography>
            </Grid>
            <Grid
              sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.jobsComplete')}
              </Typography>
              <Typography color={colorPalette.primary.light} variant="h6">
                {stats.solved}
              </Typography>
            </Grid>
            <Grid
              sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.hmtEarned')}
              </Typography>
              <Typography color={colorPalette.primary.light} variant="h6">
                {stats.balance.total}
                <span style={{ color: colorPalette.text.primary }}>
                  {t('inputMasks.humanCurrencySuffix')}
                </span>
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Divider />
        <Grid sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Typography variant="body7">
            {t('worker.hcaptchaLabelingStats.lastHour')}
          </Typography>
          <Grid container gap="1rem" justifyContent="space-between">
            <Grid
              sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.earnedLastHour')}
              </Typography>
              <Typography color={colorPalette.primary.light} variant="h6">
                {stats.balance.recent}
                <span style={{ color: colorPalette.text.primary }}>
                  {t('inputMasks.humanCurrencySuffix')}
                </span>
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '2rem',
          }}
        >
          <Grid>
            <Typography
              component="div"
              sx={{ lineHeight: '1.3' }}
              variant="body8"
            >
              {t('worker.hcaptchaLabelingStats.statisticsNotLive')}
            </Typography>
          </Grid>
          <Grid
            component="a"
            onClick={() => {
              refetch();
            }}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              ':hover': {
                cursor: 'pointer',
              },
            }}
          >
            <RefreshIcon />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
