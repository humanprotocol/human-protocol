import { Divider, Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import { colorPalette } from '@/styles/color-palette';
import { RefreshIcon } from '@/components/ui/icons';

export function UserStatsDetails() {
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
                16,234
              </Typography>
            </Grid>
            <Grid
              sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.jobsServed')}
              </Typography>
              <Typography color={colorPalette.primary.light} variant="h6">
                13,234
              </Typography>
            </Grid>
            <Grid
              sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.hmtEarned')}
              </Typography>
              <Typography color={colorPalette.primary.light} variant="h6">
                16,234
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Divider />
        <Grid sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Typography variant="body7">
            {t('worker.hcaptchaLabelingStats.thisSession')}
          </Typography>
          <Grid container gap="1rem" justifyContent="space-between">
            <Grid
              sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <Typography variant="caption">
                {t('worker.hcaptchaLabelingStats.earnedSinceLogged')}
              </Typography>
              <Typography color={colorPalette.primary.light} variant="h6">
                16,234
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
          <Grid container>
            <Typography variant="body8">
              {t('worker.hcaptchaLabelingStats.statisticsNotLive')}
            </Typography>
            <br />
            <Typography variant="body8">
              {t('worker.hcaptchaLabelingStats.refresh')}
            </Typography>
          </Grid>
          <Grid
            component="a"
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
