import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import type { Dispatch, SetStateAction } from 'react';
import { HumanLogoNavbarIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { NAVBAR_PADDING } from '@/components/layout/protected/navbar';
import { colorPalette } from '@/styles/color-palette';
import { useColorMode } from '@/hooks/use-color-mode';
import { onlyDarkModeColor } from '@/styles/dark-color-palette';
import { useHandleMainNavIconClick } from '@/hooks/use-handle-main-nav-icon-click';

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
}: DrawerNavigationProps) {
  const { isDarkMode } = useColorMode();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();
  const handleMainNavIconClick = useHandleMainNavIconClick();

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
          <List
            sx={{
              marginTop: isMobile ? '66px' : '16px',
            }}
          >
            {topMenuItems?.map((item, index) => {
              if (!('label' in item)) {
                return (
                  <ListItem key={crypto.randomUUID()}>
                    <Stack
                      direction="row"
                      sx={{
                        ml: isMobile ? '28px' : NAVBAR_PADDING,
                      }}
                    >
                      {item}
                    </Stack>
                  </ListItem>
                );
              }

              const { link, label, disabled, href, onClick, icon } = item;
              const isActive = Boolean(link && location.pathname === link);

              return (
                <ListItem
                  disablePadding
                  key={link}
                  sx={{ padding: '0 8px', borderRadius: '4px' }}
                >
                  <ListItemButton
                    disabled={disabled}
                    onClick={() => {
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
                    }}
                    selected={isActive}
                    sx={{
                      borderRadius: '4px',
                      p: 0,
                      '&.Mui-selected': {
                        backgroundColor: isDarkMode
                          ? onlyDarkModeColor.listItemColor
                          : colorPalette.primary.shades,
                      },
                    }}
                  >
                    <Stack
                      alignItems="center"
                      direction="row"
                      gap="32px"
                      justifyContent="center"
                      sx={{
                        padding: '8px 16px',
                      }}
                    >
                      {icon}
                      <ListItemText
                        disableTypography
                        primary={
                          <Typography
                            component="span"
                            variant={isMobile ? 'h5' : 'body1'}
                          >
                            {label}
                          </Typography>
                        }
                        sx={{
                          marginLeft: index === 0 ? '10px' : '0px',
                        }}
                      />
                    </Stack>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          <List>
            {bottomMenuItems?.map((item) => {
              if (!('label' in item)) {
                return (
                  <ListItem key={crypto.randomUUID()}>
                    <Stack
                      direction="row"
                      sx={{
                        width: '100%',
                        mx: isMobile ? '28px' : NAVBAR_PADDING,
                      }}
                    >
                      {item}
                    </Stack>
                  </ListItem>
                );
              }

              const { label, link, icon, href, onClick } = item;
              const isActive = location.pathname === link;

              return (
                <ListItem
                  alignItems="center"
                  disablePadding
                  key={label}
                  sx={{ padding: '0 8px', borderRadius: '4px' }}
                >
                  <ListItemButton
                    alignItems="center"
                    onClick={() => {
                      if (onClick) {
                        onClick();
                        return;
                      }
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
                    }}
                    selected={isActive}
                    sx={{
                      borderRadius: '4px',
                      p: 0,
                      '&.Mui-selected': {
                        backgroundColor: isDarkMode
                          ? onlyDarkModeColor.listItemColor
                          : colorPalette.primary.shades,
                      },
                    }}
                  >
                    <Stack
                      alignItems="center"
                      direction="row"
                      gap="32px"
                      justifyContent="center"
                      sx={{
                        padding: '8px 16px',
                      }}
                    >
                      {icon}
                      <ListItemText
                        disableTypography
                        primary={
                          <Typography
                            component="span"
                            variant={isMobile ? 'h5' : 'body1'}
                          >
                            {label}
                          </Typography>
                        }
                        sx={{
                          textAlign: 'center',
                          marginLeft: '10px',
                        }}
                      />
                    </Stack>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
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
