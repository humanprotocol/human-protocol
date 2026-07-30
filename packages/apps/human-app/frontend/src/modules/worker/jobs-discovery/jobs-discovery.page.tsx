import { useEffect } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { t } from 'i18next';

import { OraclesList } from './components';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useGetOracles } from '../hooks';
import { useGetOraclesNotifications } from '../hooks/use-get-oracles-notifications';
import { HCaptchaWidget } from './components/hcaptha-widget';

const bull = (
  <Box component="span" sx={{ display: 'inline-block', mx: 0.75 }}>
    •
  </Box>
);

export function JobsDiscoveryPage() {
  const { colorPalette } = useColorMode();
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
          alignItems: 'space-between',
          pt: { xs: 0, md: 0 },
          pb: { xs: 0, md: 4 },
          px: { xs: 0, md: 4 },
          mx: { xs: 2, md: 0 },
          borderRadius: { xs: '10px', md: 0 },
          border: {
            xs: `1px solid ${colorPalette.border.main}`,
            md: 'none',
          },
          borderBottom: {
            xs: `1px solid ${colorPalette.border.main}`,
            md: `1px solid ${colorPalette.border.main}`,
          },
        }}
      >
        <HCaptchaWidget />
      </Stack>
      <Stack sx={{ gap: { xs: 2.5, md: 4 }, px: { xs: 2, md: 4 }, py: 4 }}>
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
