import HCaptcha from '@hcaptcha/react-hcaptcha';
import Grid from '@mui/material/Grid';
import { Paper, Typography } from '@mui/material';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { env } from '@/shared/env';
import { breakpoints } from '@/styles/theme';
import { Counter } from '@/components/ui/counter';
import { useHCaptchaUserStats } from '@/api/servieces/worker/hcaptcha-user-stats';
import { PageCardError, PageCardLoader } from '@/components/ui/page-card';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { useDailyHmtSpent } from '@/api/servieces/worker/daily-hmt-spent';
import { getTomorrowDate } from '@/shared/helpers/counter-helpers';
import { useSolveHCaptchaMutation } from '@/api/servieces/worker/solve-hcaptcha';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { useHCaptchaLabelingNotifications } from '@/hooks/use-hcaptcha-labeling-notifications';

export function HcaptchaLabelingPage() {
  const captchaRef = useRef<HCaptcha>(null);
  const { user } = useAuthenticatedUser();
  const { onSuccess, onError } = useHCaptchaLabelingNotifications();

  const resetCaptcha = () => {
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
  };

  const { mutate: solveHCaptchaMutation } = useSolveHCaptchaMutation({
    onSuccess: async () => {
      await onSuccess();
      resetCaptcha();
    },
    onError: async (e) => {
      await onError(e);
      resetCaptcha();
    },
  });

  const {
    data: hcaptchaUserStats,
    isPending: isHcaptchaUserStatsPending,
    isError: isHcaptchaUserStatsError,
    error: hcaptchaUserStatsError,
  } = useHCaptchaUserStats();

  const {
    data: dailyHmtSpent,
    isPending: isDailyHmtSpentPending,
    isError: isDailyHmtSpentError,
    error: dailyHmtSpentError,
  } = useDailyHmtSpent();

  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const canSolveCaptcha =
    dailyHmtSpent &&
    hcaptchaUserStats &&
    (hcaptchaUserStats.solved < env.VITE_DAILY_SOLVED_CAPTCHA_LIMIT ||
      dailyHmtSpent.spend < env.VITE_HMT_DAILY_SPENT_LIMIT);

  const hcaptchaOnSuccess = (token: string) => {
    solveHCaptchaMutation({ token });
  };

  if (isHcaptchaUserStatsPending || isDailyHmtSpentPending) {
    return <PageCardLoader />;
  }

  if (isHcaptchaUserStatsError || isDailyHmtSpentError) {
    return (
      <PageCardError
        cardMaxWidth="100%"
        errorMessage={defaultErrorMessage(
          hcaptchaUserStatsError || dailyHmtSpentError
        )}
      />
    );
  }

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
          padding: isMobile ? 0 : '40px',
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
            {canSolveCaptcha ? (
              <Grid container sx={{ width: '100%', justifyContent: 'center' }}>
                <HCaptcha
                  // @ts-expect-error -- this props are not defined by TS by are used for enterprise version: https://github.com/hCaptcha/react-hcaptcha?tab=readme-ov-file#references
                  custom
                  endpoint={env.VITE_H_CAPTCHA_EXCHANGE_URL}
                  onVerify={hcaptchaOnSuccess}
                  ref={captchaRef}
                  reportapi={env.VITE_H_CAPTCHA_LABELING_BASE_URL}
                  sitekey={user.site_key || ''}
                />
              </Grid>
            ) : (
              <Grid container sx={{ flexDirection: 'column', gap: '24px' }}>
                <Typography variant="subtitle2">
                  {t('worker.hcaptchaLabeling.noJobs')}
                </Typography>
                <Typography color={colorPalette.primary.light} variant="h4">
                  <Counter
                    date={getTomorrowDate().toISOString()}
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
