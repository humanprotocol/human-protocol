import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { ProfileData } from '@/modules/worker/profile/components/profile-data';
import { routerPaths } from '@/router/router-paths';
import { Button } from '@/shared/components/ui/button';
import { ColorModeSwitch } from '@/shared/components/ui/dark-mode-switch';
import {
  HelpIcon,
  HumanLogoNavbarIcon,
  TriangleIcon,
} from '@/shared/components/ui/icons';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import { useHandleMainNavIconClick } from '@/shared/hooks/use-handle-main-nav-icon-click';

const menuItems = [
  {
    labelKey: 'components.DrawerNavigation.availableJobs',
    href: routerPaths.worker.jobsDiscovery,
  },
  {
    labelKey: 'components.DrawerNavigation.myJobs',
    href: routerPaths.worker.myJobs,
  },
] as const;

export function DesktopAsideBar() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const handleMainNavIconClick = useHandleMainNavIconClick();

  const activeLinkGradient = isDarkMode
    ? 'linear-gradient(90deg, rgba(212, 207, 255, 0.10) 0%, rgba(37, 29, 71, 0.10) 90%)'
    : 'linear-gradient(90deg, rgba(50, 10, 141, 0.10) 0%, rgba(255, 255, 255, 0.10) 90%)';

  return (
    <Stack
      component="aside"
      sx={{
        flexShrink: 0,
        alignSelf: 'flex-start',
        position: 'sticky',
        top: '16px',
        height: 'calc(100dvh - 32px)',
        overflow: 'hidden',
        width: 'clamp(260px, 20vw, 330px)',
        backgroundColor: colorPalette.background.paper,
        borderRadius: '30px',
        border: '1px solid',
        borderColor: colorPalette.border.main,
      }}
    >
      <Box
        component="nav"
        sx={{ display: 'flex', justifyContent: 'center', py: 8 }}
      >
        <IconButton
          aria-label={t('components.navbar.home')}
          disableRipple
          sx={{
            background: 'none',
            p: 0,
          }}
          onClick={handleMainNavIconClick}
        >
          <HumanLogoNavbarIcon />
        </IconButton>
      </Box>
      <Stack sx={{ justifyContent: 'space-between', flex: 1 }}>
        <Box sx={{ height: '100px' }}>
          <List sx={{ p: 0 }}>
            {menuItems.map((item) => {
              const { href, labelKey } = item;
              const isActive = pathname === href;
              return (
                <ListItem
                  key={href}
                  sx={{
                    p: 0,
                    background: isActive ? activeLinkGradient : 'transparent',
                  }}
                >
                  <ListItemButton
                    component={Link}
                    to={item.href}
                    sx={{
                      alignItems: 'center',
                      px: 4,
                      py: 2,
                      gap: 1,
                      fontSize: 16,
                      fontWeight: 600,
                      color: isActive
                        ? colorPalette.text.primary
                        : colorPalette.text.auxiliary100,
                      letterSpacing: 0,
                    }}
                  >
                    {isActive && <TriangleIcon />}
                    {t(labelKey)}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
        <Stack
          sx={{
            height: 160,
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            borderTop: '1px solid',
            borderColor: colorPalette.border.main,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              height: 70,
              borderBottom: '1px solid',
              borderColor: colorPalette.border.main,
            }}
          >
            <Stack
              sx={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '1px solid',
                borderColor: colorPalette.border.main,
              }}
            >
              <ColorModeSwitch />
            </Stack>
            <Stack
              sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Button
                variant="text"
                startIcon={<HelpIcon />}
                disableRipple
                sx={{ height: 32, p: 0, bgcolor: 'transparent' }}
                onClick={() => {
                  // @ts-expect-error -- ...
                  if ($zoho?.salesiq?.chat?.start) {
                    // @ts-expect-error -- ...
                    $zoho.salesiq.chat.start();
                  }
                }}
              >
                {t('components.DrawerNavigation.help')}
              </Button>
            </Stack>
          </Box>
          <Stack
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              height: 90,
              pl: 2,
            }}
          >
            <ProfileData />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
