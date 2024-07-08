import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import type { Dispatch, SetStateAction } from 'react';
import { HumanLogoNavbarIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-is-mobile';

const drawerWidth = 240;

export interface DrawerItem {
  label: string;
  link?: string;
  icon?: JSX.Element;
  disabled?: boolean;
  onClick?: () => void;
}

export type TopMenuItem = DrawerItem | JSX.Element;
export type BottomMenuItem = DrawerItem;
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <Box sx={{ display: 'flex' }}>
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
          <Stack alignItems="center">
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
              marginTop: '66px',
            }}
          >
            {topMenuItems?.map((item, index) => {
              if (!('label' in item)) {
                return (
                  <ListItem
                    key={crypto.randomUUID()}
                    onClick={() => {
                      setDrawerOpen(false);
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{
                        ml: isMobile ? '28px' : '56px',
                      }}
                    >
                      {item}
                    </Stack>
                  </ListItem>
                );
              }

              const { link, label, disabled } = item;
              return (
                <ListItem disablePadding key={link}>
                  <ListItemButton
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      if (isMobile) setDrawerOpen(false);
                      if (link) {
                        navigate(link);
                      }
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{
                        ml: isMobile ? '28px' : '56px',
                      }}
                    >
                      <ListItemText
                        disableTypography
                        primary={
                          <Typography
                            component="span"
                            fontWeight={index === 0 ? '600' : '500'}
                            variant="body2"
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
            {bottomMenuItems?.map(({ label, link, icon }) => (
              <ListItem alignItems="center" disablePadding key={link}>
                <ListItemButton
                  alignItems="center"
                  onClick={() => {
                    if (isMobile) setDrawerOpen(false);
                    if (link) {
                      navigate(link);
                    }
                  }}
                >
                  <Stack
                    alignItems="center"
                    direction="row"
                    justifyContent="center"
                    sx={{
                      ml: isMobile ? '12px' : '56px',
                    }}
                  >
                    {icon}
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography component="span" variant="body1">
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
            ))}
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
