import { Box, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { t } from 'i18next';

import { Button } from '@/shared/components/ui/button';
import { HcaptchaIcon } from '@/shared/components/ui/icons';
import { useColorMode } from '@/shared/contexts/color-mode';
import { routerPaths } from '@/router/router-paths';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useMemo } from 'react';

const getHCaptchaPagePath = (siteKey: string | null | undefined): string =>
  siteKey
    ? routerPaths.worker.HcaptchaLabeling
    : routerPaths.worker.enableLabeler;

const renderDescription = (color: string, isMobile: boolean) => {
  return (
    <Typography
      sx={{
        color,
        fontSize: { xs: 12, md: 16 },
        fontWeight: 500,
      }}
    >
      {isMobile
        ? t('worker.hcaptchaWidget.shortDescription')
        : t('worker.hcaptchaWidget.description')}
    </Typography>
  );
};

export function HCaptchaWidget() {
  const { colorPalette } = useColorMode();
  const isMobile = useIsMobile();
  const { user } = useAuthenticatedUser();

  const hCaptchaPagePath = useMemo(
    () => getHCaptchaPagePath(user.site_key),
    [user.site_key]
  );

  console.log(user);

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{
        alignItems: 'center',
        gap: 2,
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: { xs: '100%', md: 'auto' },
          gap: { xs: 1, md: 3 },
          '& svg': { width: { xs: 32, md: 70 }, height: { xs: 32, md: 70 } },
        }}
      >
        <HcaptchaIcon />
        <Stack
          sx={{
            alignItems: 'space-between',
            maxWidth: { xs: '100%', md: '350px', lg: '450px' },
          }}
        >
          <Typography
            variant={isMobile ? 'body2' : 'h6'}
            sx={{ fontWeight: 700, letterSpacing: '0.12px' }}
          >
            {t('worker.hcaptchaWidget.title')}
          </Typography>
          {!isMobile &&
            renderDescription(colorPalette.text.auxiliary200, isMobile)}
        </Stack>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {isMobile &&
          renderDescription(colorPalette.text.auxiliary200, isMobile)}
        <Button
          component={Link}
          to={hCaptchaPagePath}
          variant="contained"
          size={isMobile ? 'medium' : 'large'}
          color="accent"
          sx={{ flexShrink: 0 }}
        >
          {t('worker.hcaptchaWidget.startTask')}
        </Button>
      </Box>
    </Stack>
  );
}
