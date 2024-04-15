import { useState } from 'react';
import { Box, Drawer, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MenuIcon from '@mui/icons-material/Menu';
import { HumanLogoIcon, HumanLogoNavbarIcon } from '@/components/ui/icons';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Button } from '@/components/ui/button';
import { breakpoints } from '@/styles/theme';

interface NavbarProps {
  withNavigation: boolean;
}

export function Navbar({ withNavigation }: NavbarProps) {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
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
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <Button size="large" variant="text">
              {t('components.navbar.humanProtocol')}
            </Button>
            <Button size="large" variant="text">
              {t('components.navbar.howItWorks')}
            </Button>
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
