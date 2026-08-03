import { useRef, useState } from 'react';
import { t } from 'i18next';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Box, Divider, Paper, Stack, Typography } from '@mui/material';

import { env } from '@/shared/env';
import { Counter } from '@/shared/components/ui/counter';
import { getErrorMessageForError } from '@/shared/errors';
import { getTomorrowDate } from '@/shared/helpers/date';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useHCaptchaLabelingNotifications } from '@/modules/worker/hooks/use-hcaptcha-labeling-notifications';
import { useColorMode } from '@/shared/contexts/color-mode';
import {
  PageCardLoader,
  PageCardError,
} from '@/shared/components/ui/page-card';
import {
  useHCaptchaUserStats,
  useDailyHmtSpent,
  useSolveHCaptchaMutation,
} from './hooks';
import { Breadcrumbs } from './components/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { UserStatsAccordion } from './components/user-stats-accordion';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { UserStatsDrawer } from './components/user-stats-drawer';

export function HcaptchaLabelingPage() {
  const [isStatsDrawerOpen, setIsStatsDrawerOpen] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);

  const { colorPalette } = useColorMode();
  const { user } = useAuthenticatedUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { onSuccess, onError } = useHCaptchaLabelingNotifications();

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

  const isError = isDailyHmtSpentError || isHcaptchaUserStatsError;
  const isPending = isHcaptchaUserStatsPending || isDailyHmtSpentPending;

  const canSolveCaptcha =
    dailyHmtSpent &&
    hcaptchaUserStats &&
    hcaptchaUserStats.currentDateStats.solved <
      env.VITE_DAILY_SOLVED_CAPTCHA_LIMIT &&
    dailyHmtSpent.spend < env.VITE_HMT_DAILY_SPENT_LIMIT;

  const hcaptchaOnSuccess = (token: string) => {
    solveHCaptchaMutation({ token });
  };

  const resetCaptcha = () => {
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
  };

  return (
    <Stack
      sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          width: '100%',
          py: { xs: 2, md: 6 },
          px: { xs: 2, md: 4 },
          borderBottom: {
            xs: 'none',
            md: `1px solid ${colorPalette.border.main}`,
          },
        }}
      >
        <Breadcrumbs />
        {isMobile ? (
          <Button
            variant="outlined"
            size="small"
            sx={{ py: 0.5 }}
            onClick={() => setIsStatsDrawerOpen(true)}
          >
            {t('worker.hcaptchaLabelingStats.statistics')}
          </Button>
        ) : (
          <UserStatsAccordion />
        )}
      </Box>
      <Stack
        sx={{
          width: '100%',
          flex: 1,
          px: { xs: 2, md: 4 },
          py: { xs: 0, md: 6 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: { xs: 'transparent', md: colorPalette.background.subtle },
            borderRadius: '20px',
            border: {
              xs: 'none',
              md: `1px solid ${colorPalette.border.strong}`,
            },
          }}
        >
          {isPending && !isError && <PageCardLoader />}
          {isError && (
            <PageCardError
              cardMaxWidth="100%"
              errorMessage={getErrorMessageForError(
                hcaptchaUserStatsError ?? dailyHmtSpentError
              )}
            />
          )}
          {!isPending && !isError && (
            <Stack
              sx={{
                justifyContent: 'center',
                height: '100%',
                width: { xs: 'unset', md: '320px' },
              }}
            >
              {canSolveCaptcha ? (
                <>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: { xs: 3, md: 6 },
                      color: colorPalette.text.auxiliary100,
                    }}
                  >
                    {t('worker.hcaptchaLabeling.description')}
                  </Typography>
                  <Stack sx={{ width: '100%', justifyContent: 'center' }}>
                    <HCaptcha
                      custom
                      // @ts-expect-error -- this props are not defined by TS by are used for enterprise version: https://github.com/hCaptcha/react-hcaptcha?tab=readme-ov-file#references
                      endpoint={env.VITE_H_CAPTCHA_EXCHANGE_URL}
                      onVerify={hcaptchaOnSuccess}
                      ref={captchaRef}
                      reportapi={env.VITE_H_CAPTCHA_LABELING_BASE_URL}
                      sitekey={user.site_key ?? ''}
                      theme="contrast"
                    />
                  </Stack>
                </>
              ) : (
                <Stack sx={{ gap: { xs: 3, md: 5 } }}>
                  <Typography
                    variant="body1"
                    sx={{ color: colorPalette.text.auxiliary100 }}
                  >
                    {t('worker.hcaptchaLabeling.noJobs')}
                  </Typography>
                  <Stack
                    sx={{
                      borderRadius: '15px',
                      border: `1px solid ${colorPalette.border.main}`,
                    }}
                  >
                    <Stack sx={{ p: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: colorPalette.text.auxiliary200 }}
                      >
                        {t('worker.hcaptchaLabeling.waitFor')}
                      </Typography>
                      <Typography
                        sx={{
                          color: colorPalette.text.primary,
                          fontSize: { xs: 16, md: 32 },
                          fontWeight: 700,
                          lineHeight: 'normal',
                          letterSpacing: '0.25px',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        <Counter
                          date={getTomorrowDate().toISOString()}
                          onFinish={() => {
                            navigate(0);
                          }}
                        />
                      </Typography>
                    </Stack>
                    <Box sx={{ position: 'relative', width: '100%' }}>
                      <Divider sx={{ bgcolor: colorPalette.border.main }} />
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: 700,
                          lineHeight: '125%',
                          letterSpacing: '0.25px',
                          color: colorPalette.text.primary,
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          bgcolor: colorPalette.background.subtle,
                        }}
                      >
                        {t('worker.hcaptchaLabeling.or')}
                      </Typography>
                    </Box>
                    <Stack sx={{ p: 3, alignItems: 'center' }}>
                      <Button
                        component={RouterLink}
                        to={routerPaths.worker.jobsDiscovery}
                        variant="contained"
                        color="accent"
                        fullWidth
                      >
                        {t('worker.hcaptchaLabeling.browseAvailableJobs')}
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              )}
            </Stack>
          )}
        </Paper>
      </Stack>
      <UserStatsDrawer
        isOpen={isStatsDrawerOpen}
        onClose={() => setIsStatsDrawerOpen(false)}
      />
    </Stack>
  );
}
