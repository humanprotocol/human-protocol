import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import { Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import type { Dispatch, SetStateAction } from 'react';
import { HumanLogoNavbarIcon } from '@/shared/components/ui/icons';
import { Button } from '@/shared/components/ui/button';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useHandleMainNavIconClick } from '@/shared/hooks/use-handle-main-nav-icon-click';
import { TopMenuItemsList } from './top-menu-items-list';
import { BottomMenuItemsList } from './bottom-menu-items-list';

const drawerWidth = 240;

export interface DrawerItem {
  label: string;
  link?: string;
  href?: string;
  icon?: JSX.Element;
  disabled?: boolean;
  onClick?: () => void;
}

export type TopMenuItem = DrawerItem | JSX.Element;
export type BottomMenuItem = DrawerItem | JSX.Element;
interface DrawerNavigationProps {
  open: boolean;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
  topMenuItems?: TopMenuItem[];
  bottomMenuItems?: BottomMenuItem[];
  signOut: () => void;
}

export function DrawerNavigation({
  open,
  setDrawerOpen,
  topMenuItems,
  bottomMenuItems,
  signOut,
}: Readonly<DrawerNavigationProps>) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const handleMainNavIconClick = useHandleMainNavIconClick();

  const handleItemClick = ({ disabled, href, link, onClick }: DrawerItem) => {
    if (onClick) {
      onClick();
      return;
    }
    if (disabled) return;
    if (isMobile) setDrawerOpen(false);
    if (href) {
      const element = document.createElement('a');
      element.href = href;
      element.target = '_blank';
      document.body.appendChild(element);
      element.click();
      return;
    }
    if (link && !href) {
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
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : drawerWidth,
            boxSizing: 'border-box',
            paddingTop: '44px',
          },
        }}
        variant="persistent"
      >
        {!isMobile && (
          <Stack
            alignItems="flex-start"
            sx={{ paddingLeft: '26px', cursor: 'pointer' }}
            onClick={() => {
              handleMainNavIconClick();
            }}
          >
            <HumanLogoNavbarIcon />
          </Stack>
        )}
        <Stack
          justifyContent="space-between"
          sx={{
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
