import { ProfileData } from '@/modules/worker/profile/components/profile-data';
import { Button } from '@/shared/components/ui/button';
import { ColorModeSwitch } from '@/shared/components/ui/dark-mode-switch';
import { HelpIcon, HumanLogoNavbarIcon } from '@/shared/components/ui/icons';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import { useHandleMainNavIconClick } from '@/shared/hooks/use-handle-main-nav-icon-click';
import { Box, IconButton, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function DesktopAsideBar() {
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();
  const handleMainNavIconClick = useHandleMainNavIconClick();

  return (
    <Stack
      component="aside"
      sx={{
        flexShrink: 0,
        alignSelf: 'stretch',
        width: 330,
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
        <Box sx={{ height: '100px' }}></Box>
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
