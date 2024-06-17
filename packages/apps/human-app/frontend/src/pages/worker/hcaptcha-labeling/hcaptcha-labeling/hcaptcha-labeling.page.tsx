import HCaptcha from '@hcaptcha/react-hcaptcha';
import Grid from '@mui/material/Grid';
import { Paper, Typography } from '@mui/material';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { env } from '@/shared/env';
import { breakpoints } from '@/styles/theme';
import { Counter } from '@/components/ui/counter';

const JOB_STATS = {
  available: false,
  counter: 10000,
};

export function HcaptchaLabelingPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const hcaptchaOnError = (_: string) => {
    // TODO
  };
  const hcaptchaOnSuccess = (_: string) => {
    // TODO
  };

  return (
    <Grid
      alignItems="center"
      height="100%"
      item
      justifyContent="center"
      xs={12}
    >
      <Paper
        sx={{
          backgroundColor: isMobile
            ? colorPalette.paper.main
            : colorPalette.white,
          height: '100%',
          boxShadow: 'none',
          padding: '40px',
          borderRadius: '20px',
        }}
      >
        <Grid
          container
          sx={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Grid
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              height: '100%',
              width: '376px',
              gap: '52px',
              [breakpoints.mobile]: {
                width: 'unset',
              },
            }}
          >
            <Typography variant="body1">
              {t('worker.hcaptchaLabeling.description')}
            </Typography>
            {JOB_STATS.available ? (
              <Grid container sx={{ width: '100%', justifyContent: 'center' }}>
                <HCaptcha
                  onError={hcaptchaOnError}
                  onVerify={hcaptchaOnSuccess}
                  sitekey={env.VITE_H_CAPTCHA_SITE_KEY}
                />
              </Grid>
            ) : (
              <Grid container sx={{ flexDirection: 'column', gap: '24px' }}>
                <Typography variant="subtitle2">
                  {t('worker.hcaptchaLabeling.noJobs')}
                </Typography>
                <Typography color={colorPalette.primary.light} variant="h4">
                  <Counter
                    date="2024-06-27T16:50:11+0000"
                    onFinish={() => {
                      navigate(0);
                    }}
                  />
                </Typography>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
