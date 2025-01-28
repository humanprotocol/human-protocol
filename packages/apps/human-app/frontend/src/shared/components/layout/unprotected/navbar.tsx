import { useState } from 'react';
import { Box, Drawer, Grid, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';
import {
  HumanLogoIcon,
  HumanLogoNavbarIcon,
} from '@/shared/components/ui/icons';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Button } from '@/shared/components/ui/button';
import { breakpoints } from '@/shared/styles/breakpoints';
import { env } from '@/shared/env';
import { DarkModeSwitch } from '@/shared/components/ui/dark-mode-switch';
import { useHandleMainNavIconClick } from '@/shared/hooks/use-handle-main-nav-icon-click';
import { useHomePageState } from '@/shared/contexts/homepage-state';

interface NavbarProps {
  withNavigation: boolean;
}

export function Navbar({ withNavigation }: NavbarProps) {
  const { isMainPage } = useHomePageState();
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const handleMainNavIconClick = useHandleMainNavIconClick();

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
        pr: isMobile ? '44px' : 0,
        pl: isMobile ? '44px' : '8px',
        [breakpoints.mobile]: {
          height: '104px',
          margin: '0',
        },
      }}
    >
      <Grid
        sx={{ cursor: 'pointer' }}
        onClick={() => {
          handleMainNavIconClick();
        }}
        role="button"
        tabIndex={0}
        aria-hidden="true"
      >
        {isMobile ? <HumanLogoIcon /> : <HumanLogoNavbarIcon />}
      </Grid>
      {withNavigation ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: {
                width: '100%',
                xs: 'none',
                md: 'flex',
                height: '2rem',
                gap: '1.5rem',
                whiteSpace: 'nowrap',
              },
            }}
          >
            {isMainPage ? (
              <>
                <div>
                  <Button
                    component={Link}
                    size="large"
                    to={env.VITE_NAVBAR__LINK__PROTOCOL_URL}
                    variant="text"
                  >
                    {t('components.navbar.humanProtocol')}
                  </Button>
                </div>
                <div>
                  <Button
                    component={Link}
                    size="large"
                    to={env.VITE_NAVBAR__LINK__HOW_IT_WORK_URL}
                    variant="text"
                  >
                    {t('components.navbar.howItWorks')}
                  </Button>
                </div>
                <DarkModeSwitch />
              </>
            ) : null}
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              color="primary"
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
                <DarkModeSwitch />
              </Box>
            </Drawer>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
