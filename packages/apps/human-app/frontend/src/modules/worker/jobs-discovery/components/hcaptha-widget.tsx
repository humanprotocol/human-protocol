import { useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { t } from 'i18next';

import { env } from '@/shared/env';
import { Button } from '@/shared/components/ui/button';
import {
  HcaptchaDisabledIcon,
  HcaptchaIcon,
} from '@/shared/components/ui/icons';
import { useColorMode } from '@/shared/contexts/color-mode';
import { routerPaths } from '@/router/router-paths';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import {
  useHCaptchaUserStats,
  useDailyHmtSpent,
} from '../../hcaptcha-labeling/hooks';
import { getTomorrowDate } from '@/shared/helpers/date';
import { Counter } from '@/shared/components/ui/counter';
import { Loader } from '@/shared/components/ui/loader';

const getHCaptchaPagePath = (siteKey: string | null | undefined): string =>
  siteKey
    ? routerPaths.worker.HcaptchaLabeling
    : routerPaths.worker.enableLabeler;

const renderDescription = (color: string, isMobile: boolean) => {
  let description = '';

  if (isMobile) {
    description = t('worker.hcaptchaWidget.shortDescription');
  } else {
    description = t('worker.hcaptchaWidget.description');
  }

  return (
    <Typography
      sx={{
        color,
        fontSize: { xs: 12, md: 16 },
        fontWeight: 500,
        letterSpacing: '0.12px',
        lineHeight: 'normal',
      }}
    >
      {description}
    </Typography>
  );
};

export function HCaptchaWidget() {
  const { colorPalette } = useColorMode();
  const { user } = useAuthenticatedUser();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const { data: hcaptchaUserStats, isPending: isHcaptchaUserStatsPending } =
    useHCaptchaUserStats();

  const { data: dailyHmtSpent, isPending: isDailyHmtSpentPending } =
    useDailyHmtSpent();

  const hCaptchaPagePath = useMemo(
    () => getHCaptchaPagePath(user.site_key),
    [user.site_key]
  );

  if (isHcaptchaUserStatsPending || isDailyHmtSpentPending) {
    return (
      <Stack
        sx={{
          width: '100%',
          height: { xs: '104px', md: '71px' },
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader />
      </Stack>
    );
  }

  const isCaptchaLimitReached =
    !!dailyHmtSpent &&
    !!hcaptchaUserStats &&
    hcaptchaUserStats.currentDateStats.solved >=
      env.VITE_DAILY_SOLVED_CAPTCHA_LIMIT &&
    dailyHmtSpent.spend >= env.VITE_HMT_DAILY_SPENT_LIMIT;

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{
        alignItems: 'center',
        gap: { xs: 0, md: 2 },
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      {isCaptchaLimitReached ? (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: { xs: '100%', md: 'auto' },
              gap: { xs: 1, md: 3 },
              px: { xs: 1, md: 0 },
              py: { xs: 2, md: 0 },
              '& svg': {
                flexShrink: 0,
                width: { xs: 32, md: 70 },
                height: { xs: 32, md: 70 },
              },
            }}
          >
            <HcaptchaDisabledIcon />
            <Stack
              sx={{
                justifyContent: 'space-between',
                maxWidth: { xs: '100%', md: '350px', lg: '450px' },
              }}
            >
              <Typography
                variant={isMobile ? 'body2' : 'h6'}
                sx={{
                  color: colorPalette.text.auxiliary200,
                  fontWeight: 700,
                  letterSpacing: '0.12px',
                }}
              >
                {t('worker.hcaptchaWidget.titleDisabled')}
              </Typography>
              {!isMobile && (
                <Typography
                  sx={{
                    color: colorPalette.text.auxiliary100,
                    fontSize: 16,
                    fontWeight: 400,
                    letterSpacing: '0.12px',
                    opacity: 0.5,
                  }}
                >
                  {t('worker.hcaptchaWidget.descriptionDisabled')}
                </Typography>
              )}
            </Stack>
          </Box>
          <Stack
            direction={{ xs: 'row', md: 'column' }}
            sx={{
              alignItems: 'center',
              gap: { xs: 1, md: 0 },
              width: { xs: '100%', md: 'auto' },
              py: { xs: 0.75, md: 1.5 },
              px: { xs: 1.5, md: 2 },
              bgcolor: {
                xs: colorPalette.background.default,
                md: colorPalette.background.subtle,
              },
              borderRadius: { xs: '0px', md: '15px' },
              borderBottomLeftRadius: { xs: '10px', md: '15px' },
              borderBottomRightRadius: { xs: '10px', md: '15px' },
              border: {
                xs: 'none',
                md: `1px solid ${colorPalette.border.strong}`,
              },
              borderTop: {
                xs: `1px solid ${colorPalette.border.main}`,
                md: `1px solid ${colorPalette.border.strong}`,
              },
            }}
          >
            <Typography
              variant={isMobile ? 'body2' : 'subtitle2'}
              sx={{
                color: colorPalette.text.auxiliary200,
                fontSize: { xs: 12, md: 14 },
                fontWeight: { xs: 500, md: 600 },
              }}
            >
              {isMobile
                ? t('worker.hcaptchaWidget.nextIn')
                : t('worker.hcaptchaWidget.nextAvailable')}
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
        </>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: { xs: '100%', md: 'auto' },
              gap: { xs: 1, md: 3 },
              px: { xs: 1.5, md: 0 },
              pt: { xs: 2, md: 0 },
              '& svg': {
                flexShrink: 0,
                width: { xs: 32, md: 70 },
                height: { xs: 32, md: 70 },
              },
            }}
          >
            <HcaptchaIcon />
            <Stack
              sx={{
                justifyContent: 'space-between',
                maxWidth: { xs: '100%', md: '350px', lg: '450px' },
              }}
            >
              <Typography
                variant={isMobile ? 'body2' : 'h6'}
                sx={{
                  fontWeight: 700,
                  letterSpacing: '0.12px',
                }}
              >
                {t('worker.hcaptchaWidget.title')}
              </Typography>
              {!isMobile &&
                renderDescription(colorPalette.text.auxiliary200, isMobile)}
            </Stack>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: { xs: 1.5, md: 0 },
              py: { xs: 1.5, md: 0 },
              gap: 2,
              width: { xs: '100%', md: 'auto' },
            }}
          >
            {isMobile &&
              renderDescription(colorPalette.text.auxiliary200, isMobile)}
            <Button
              component={Link}
              to={hCaptchaPagePath}
              variant="contained"
              size={isMobile ? 'medium' : 'large'}
              color="accent"
              sx={{
                flexShrink: 0,
                py: { xs: 0.5, md: 1 },
                px: { xs: 1.5, md: 3 },
              }}
            >
              {t('worker.hcaptchaWidget.startTask')}
            </Button>
          </Box>
        </>
      )}
    </Stack>
  );
}
