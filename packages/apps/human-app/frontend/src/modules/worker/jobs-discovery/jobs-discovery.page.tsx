import { useEffect } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { t } from 'i18next';

import { OraclesList } from './components/oracles-list';
import { HCaptchaWidget } from './components/hcaptcha-widget';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useGetOracles } from '../hooks/use-get-oracles';
import { useGetOraclesNotifications } from '../hooks/use-get-oracles-notifications';
import { JobsSwitcherMobile } from '@/router/components/layout/protected/jobs-switcher-mobile';

const bull = (
  <Box component="span" sx={{ display: 'inline-block', mx: 0.75 }}>
    •
  </Box>
);

export function JobsDiscoveryPage() {
  const isMobile = useIsMobile();

  const { onError } = useGetOraclesNotifications();
  const {
    data: oraclesData,
    isError,
    isPending,
    isSuccess,
    error,
  } = useGetOracles();

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const oraclesCount = oraclesData?.length ?? 0;

  return (
    <Stack>
      <Stack
        sx={{
          justifyContent: 'center',
          p: { xs: 0, md: 4 },
          mx: { xs: 2, md: 0 },
          borderRadius: { xs: '10px', md: 0 },
          border: (theme) => ({
            xs: `1px solid ${theme.palette.border.main}`,
            md: 'none',
          }),
          borderBottom: (theme) => ({
            md: `1px solid ${theme.palette.border.main}`,
          }),
        }}
      >
        <HCaptchaWidget />
      </Stack>
      {isMobile && (
        <Stack sx={{ width: '100%', my: 2.5, px: 2 }}>
          <JobsSwitcherMobile />
        </Stack>
      )}
      <Stack
        sx={{
          gap: { xs: 2.5, md: 4 },
          px: { xs: 2, md: 4 },
          pt: { xs: 0, md: 4 },
          pb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            component="h1"
            variant={isMobile ? 'body1' : 'h6'}
            sx={{
              fontWeight: { xs: 700, md: 600 },
              lineHeight: { xs: 'normal', md: '24px' },
            }}
          >
            {t('worker.oraclesList.jobOracles')}
          </Typography>
          {isSuccess && (
            <>
              {bull}
              <Typography
                component="span"
                variant="body1"
                sx={{ fontWeight: 600 }}
              >
                {oraclesCount}{' '}
                {oraclesCount === 1
                  ? t('worker.oraclesList.source')
                  : t('worker.oraclesList.sources')}
              </Typography>
            </>
          )}
        </Box>
        <OraclesList
          data={oraclesData}
          isError={isError}
          isPending={isPending}
        />
      </Stack>
    </Stack>
  );
}
