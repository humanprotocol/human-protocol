import { Box, Container } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HumanLogoNavbarIcon } from '@/shared/components/ui/icons';
import { Button } from '@/shared/components/ui/button';
import { env } from '@/shared/env';
import { ColorModeSwitch } from '@/shared/components/ui/dark-mode-switch';
import { useHandleMainNavIconClick } from '@/shared/hooks/use-handle-main-nav-icon-click';
import { useIsMainPage } from '@/router/hooks/use-is-main-page';

export function Navbar() {
  const { t } = useTranslation();
  const handleMainNavIconClick = useHandleMainNavIconClick();
  const isMainPage = useIsMainPage();

  return (
    <Container
      maxWidth="xl"
      component="nav"
      sx={{
        position: 'static',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        my: { xs: 2, md: 3 },
        height: { xs: '84px', md: 'unset' },
        background: 'transparent',
      }}
    >
      <Button
        variant="text"
        aria-label={t('components.navbar.home')}
        disableRipple
        onClick={handleMainNavIconClick}
        sx={{
          flexShrink: 0,
          background: 'none',
          p: 0,
        }}
      >
        <HumanLogoNavbarIcon />
      </Button>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%',
          height: '44px',
          gap: 3,
          whiteSpace: 'nowrap',
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', md: isMainPage ? 'flex' : 'none' },
          }}
        >
          <Button
            component={Link}
            to={env.VITE_NAVBAR__LINK__PROTOCOL_URL}
            variant="text"
            size="large"
            disableRipple
          >
            {t('components.navbar.humanProtocol')}
          </Button>
          <Button
            component={Link}
            to={env.VITE_NAVBAR__LINK__HOW_IT_WORK_URL}
            variant="text"
            size="large"
            disableRipple
          >
            {t('components.navbar.howItWorks')}
          </Button>
        </Box>
        <ColorModeSwitch />
      </Box>
    </Container>
  );
}
