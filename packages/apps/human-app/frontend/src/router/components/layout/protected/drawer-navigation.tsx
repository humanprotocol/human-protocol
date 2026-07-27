import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import { Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import { HumanLogoNavbarIcon } from '@/shared/components/ui/icons';
import { Button } from '@/shared/components/ui/button';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useHandleMainNavIconClick } from '@/shared/hooks/use-handle-main-nav-icon-click';
import { TopMenuItemsList } from './top-menu-items-list';
import { BottomMenuItemsList } from './bottom-menu-items-list';
import { useColorMode } from '@/shared/contexts/color-mode';

const drawerWidth = 330;

export interface DrawerItem {
  label: string;
  link?: string;
  href?: string;
  icon?: ReactElement;
  disabled?: boolean;
  onClick?: () => void;
}

export type MenuItem = DrawerItem | ReactElement;
interface DrawerNavigationProps {
  open: boolean;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
  topMenuItems?: MenuItem[];
  bottomMenuItems?: MenuItem[];
  signOut: () => void;
}

export function DrawerNavigation({
  open,
  setDrawerOpen,
  topMenuItems,
  bottomMenuItems,
  signOut,
}: DrawerNavigationProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const handleMainNavIconClick = useHandleMainNavIconClick();
  const { colorPalette } = useColorMode();

  const handleItemClick = ({ disabled, href, link, onClick }: DrawerItem) => {
    if (disabled) return;

    if (isMobile) setDrawerOpen(false);

    if (onClick) {
      onClick();
      return;
    }

    if (href) {
      window.open(href, '_blank', 'noreferrer');
      return;
    }

    if (link) {
      navigate(link);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
      }}
    >
      <CssBaseline />
      <Drawer
        anchor="left"
        variant="persistent"
        open={open && !isMobile}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
        }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              width: isMobile ? '100%' : drawerWidth,
              ml: 2,
              my: 2,
              boxSizing: 'border-box',
              pt: 8,
              borderRadius: '30px',
              border: '1px solid',
              borderColor: colorPalette.border.main,
            },
          },
        }}
      >
        {!isMobile && (
          <Stack
            sx={{ alignItems: 'flex-start', pl: 3, cursor: 'pointer' }}
            onClick={handleMainNavIconClick}
          >
            <HumanLogoNavbarIcon />
          </Stack>
        )}
        <Stack
          sx={{
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          <TopMenuItemsList
            handleItemClick={handleItemClick}
            items={topMenuItems}
          />
          <BottomMenuItemsList
            handleItemClick={handleItemClick}
            items={bottomMenuItems}
          />
        </Stack>
        <Button
          onClick={() => {
            if (isMobile) setDrawerOpen(false);
            signOut();
          }}
          size="large"
          sx={{
            marginBottom: '44px',
            mx: isMobile ? '28px' : '16px',
          }}
          variant="outlined"
        >
          {t('components.DrawerNavigation.logout')}
        </Button>
      </Drawer>
    </Box>
  );
}
