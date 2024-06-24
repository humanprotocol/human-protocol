import { useState } from 'react';
import { Box, Drawer, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation } from 'react-router-dom';
import { HumanLogoIcon, HumanLogoNavbarIcon } from '@/components/ui/icons';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Button } from '@/components/ui/button';
import { breakpoints } from '@/styles/theme';
import { routerPaths } from '@/router/router-paths';
import { env } from '@/shared/env';

interface NavbarProps {
  withNavigation: boolean;
}

export function Navbar({ withNavigation }: NavbarProps) {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isMainPage = location.pathname === routerPaths.homePage;
  return (
    <Box
      position="static"
      sx={{
        background: 'transparent',
        margin: '20px 0',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
        px: isMobile ? '44px' : 0,
        [breakpoints.mobile]: {
          margin: '10px 0',
        },
      }}
    >
      {isMobile ? <HumanLogoIcon /> : <HumanLogoNavbarIcon />}
      {withNavigation ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: { xs: 'none', md: 'flex', height: '2rem' },
            }}
          >
            {isMainPage ? (
              <>
                <Button
                  component={Link}
                  size="large"
                  to={env.VITE_NAVBAR__LINK__PROTOCOL_URL}
                  variant="text"
                >
                  {t('components.navbar.humanProtocol')}
                </Button>
                <Button
                  component={Link}
                  size="large"
                  to={env.VITE_NAVBAR__LINK__HOW_IT_WORK_URL}
                  variant="text"
                >
                  {t('components.navbar.howItWorks')}
                </Button>
              </>
            ) : null}
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              onClick={() => {
                setIsDrawerOpen(!isDrawerOpen);
              }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              onClose={() => {
                setIsDrawerOpen(false);
              }}
              open={isDrawerOpen}
            >
              <Box
                sx={{
                  width: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  p: 2,
                  alignItems: 'flex-end',
                }}
              >
                <Button size="large" variant="text">
                  {t('components.navbar.humanProtocol')}
                </Button>
                <Button size="large" variant="text">
                  {t('components.navbar.howItWorks')}
                </Button>
              </Box>
            </Drawer>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
