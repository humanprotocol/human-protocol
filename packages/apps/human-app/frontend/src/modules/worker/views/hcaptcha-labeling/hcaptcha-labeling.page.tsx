import HCaptcha from '@hcaptcha/react-hcaptcha';
import Grid from '@mui/material/Grid';
import { Paper, Typography } from '@mui/material';
import { t } from 'i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { env } from '@/shared/env';
import { breakpoints } from '@/shared/styles/breakpoints';
import { Counter } from '@/shared/components/ui/counter';
import { useHCaptchaUserStats } from '@/modules/worker/services/hcaptcha-user-stats';
import {
  PageCardError,
  PageCardLoader,
} from '@/shared/components/ui/page-card';
import { getErrorMessageForError } from '@/shared/errors';
import { useDailyHmtSpent } from '@/modules/worker/services/daily-hmt-spent';
import { getTomorrowDate } from '@/shared/helpers/date';
import { useSolveHCaptchaMutation } from '@/modules/worker/services/solve-hcaptcha';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useHCaptchaLabelingNotifications } from '@/modules/worker/hooks/use-hcaptcha-labeling-notifications';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';
import { routerPaths } from '@/router/router-paths';

export function HcaptchaLabelingPage() {
  const { colorPalette, isDarkMode } = useColorMode();
  const captchaRef = useRef<HCaptcha>(null);
  const { user } = useAuthenticatedUser();
  const { onSuccess, onError } = useHCaptchaLabelingNotifications();
  const statsColor = isDarkMode
    ? onlyDarkModeColor.additionalTextColor
    : colorPalette.primary.light;

  const resetCaptcha = () => {
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
  };

  const { mutate: solveHCaptchaMutation } = useSolveHCaptchaMutation({
    onSuccess: () => {
      onSuccess();
      resetCaptcha();
    },
    onError: (e) => {
      onError(e);
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
    hcaptchaUserStats.currentDateStats.solved <
      env.VITE_DAILY_SOLVED_CAPTCHA_LIMIT &&
    dailyHmtSpent.spend < env.VITE_HMT_DAILY_SPENT_LIMIT;

  const hcaptchaOnSuccess = (token: string) => {
    solveHCaptchaMutation({ token });
  };

  if (user.kyc_status !== 'approved') {
    return <Navigate to={routerPaths.worker.profile} replace />;
  }

  if (isHcaptchaUserStatsPending || isDailyHmtSpentPending) {
    return <PageCardLoader />;
  }

  if (isHcaptchaUserStatsError || isDailyHmtSpentError) {
    return (
      <PageCardError
        cardMaxWidth="100%"
        errorMessage={getErrorMessageForError(
          hcaptchaUserStatsError ?? dailyHmtSpentError
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
          height: '100%',
          boxShadow: 'none',
          padding: isMobile ? '20px' : '40px',
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
                  sitekey={user.site_key ?? ''}
                  theme={isDarkMode ? 'dark' : 'light'}
                />
              </Grid>
            ) : (
              <Grid container sx={{ flexDirection: 'column', gap: '24px' }}>
                <Typography variant="subtitle2">
                  {t('worker.hcaptchaLabeling.noJobs')}
                </Typography>
                <Typography color={statsColor} variant="h4">
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
