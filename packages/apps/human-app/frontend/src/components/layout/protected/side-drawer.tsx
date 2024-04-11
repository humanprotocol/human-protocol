import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import type { Theme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  HelpIcon,
  HumanLogoNavbarIcon,
  UserOutlinedIcon,
  WorkIcon,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

interface SideDrawerProps {
  open: boolean;
  drawerWidth: number;
}

export function SideDrawer({ open, drawerWidth }: SideDrawerProps) {
  const theme: Theme = useTheme();
  const isMobile = !useMediaQuery(theme.breakpoints.up('md'));
  const { t } = useTranslation();

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
            {[
              'components.sideDrawer.jobs' as const,
              'components.sideDrawer.captchaLabelling' as const,
              'components.sideDrawer.jobsDiscovery' as const,
            ].map((text, index) => (
              <ListItem disablePadding key={text}>
                <ListItemButton>
                  <Stack
                    direction="row"
                    sx={{
                      ml: isMobile ? '28px' : '56px',
                    }}
                  >
                    {index === 0 && <WorkIcon />}
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography variant="body2">{t(text)}</Typography>
                      }
                      sx={{
                        marginLeft: index === 0 ? '10px' : '0px',
                      }}
                    />
                  </Stack>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <List>
            {[
              'components.sideDrawer.profile' as const,
              'components.sideDrawer.help' as const,
            ].map((text, index) => (
              <ListItem alignItems="center" disablePadding key={text}>
                <ListItemButton alignItems="center">
                  <Stack
                    alignItems="center"
                    direction="row"
                    justifyContent="center"
                    sx={{
                      ml: isMobile ? '12px' : '56px',
                    }}
                  >
                    {index === 0 && <UserOutlinedIcon />}
                    {index === 1 && (
                      <Stack
                        sx={{
                          marginLeft: '-2px',
                        }}
                      >
                        <HelpIcon />
                      </Stack>
                    )}
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography variant="body2">{t(text)}</Typography>
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
          sx={{
            marginBottom: '44px',
            mx: isMobile ? '28px' : '16px',
          }}
          variant="outlined"
        >
          Log out
        </Button>
      </Drawer>
    </Box>
  );
}
