import { Stack } from '@mui/material';
import { t } from 'i18next';

import { HumanLogoNavbarIcon } from '@/shared/components/ui/icons';
import { Button } from '@/shared/components/ui/button';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useHandleMainNavIconClick } from '@/shared/hooks/use-handle-main-nav-icon-click';
import { ColorModeSwitch } from '@/shared/components/ui/dark-mode-switch';

export function Navbar() {
  const { colorPalette } = useColorMode();
  const handleMainNavIconClick = useHandleMainNavIconClick();

  return (
    <Stack
      component="header"
      direction="row"
      sx={{
        display: { xs: 'flex', md: 'none' },
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colorPalette.background.paper,
        width: '100%',
        p: 2,
        zIndex: '130',
        position: 'sticky',
        top: 0,
      }}
    >
      <Button
        variant="text"
        aria-label={t('components.navbar.home')}
        disableRipple
        sx={{
          background: 'none',
          p: 0,
        }}
        onClick={handleMainNavIconClick}
      >
        <HumanLogoNavbarIcon />
      </Button>
      <ColorModeSwitch />
    </Stack>
  );
}
