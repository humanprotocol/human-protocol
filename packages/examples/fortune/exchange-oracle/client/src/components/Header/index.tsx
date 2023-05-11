import { Menu as MenuIcon } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Link,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Web3Button } from '@web3modal/react';
import { FC, useState } from 'react';
import { useAccount } from 'wagmi';

import logoSvg from '../../assets/logo.svg';

type NavLink = {
  title: string;
  href: string;
  external?: boolean;
};

const NAV_LINKS: NavLink[] = [
  {
    title: 'HUMAN Dashboard',
    href: 'https://dashboard.humanprotocol.org',
    external: true,
  },
  { title: 'HUMAN Website', href: 'https://humanprotocol.org', external: true },
];

export const Header: FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isDownMd = useMediaQuery(theme.breakpoints.down('md'));
  const { isConnected } = useAccount();

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const renderNavLinks = (orientation = 'horizontal') => (
    <Stack
      direction={orientation === 'horizontal' ? 'row' : 'column'}
      spacing={3}
    >
      {NAV_LINKS.map((nav) => (
        <Link
          key={nav.title}
          href={nav.href}
          target={nav.external ? '_blank' : '_self'}
          sx={{ textDecoration: 'none' }}
        >
          <Typography variant="body2" fontWeight={600}>
            {nav.title}
          </Typography>
        </Link>
      ))}
    </Stack>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          background: '#fff',
          boxShadow: 'none',
          height: '96px',
        }}
      >
        <Toolbar disableGutters>
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                boxSizing: 'border-box',
                padding: {
                  xs: '30px 8px 26px',
                  sm: '30px 28px 26px',
                  md: '30px 52px 26px',
                },
              }}
            >
              <Link
                href="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                <img src={logoSvg} alt="logo" />
                <Typography variant="h6" color="primary" ml="10px">
                  Exchange Oracle
                </Typography>
              </Link>
              {!isDownMd && (
                <Box display="flex" alignItems="center" gap={3}>
                  {renderNavLinks()}
                  {isConnected && <Web3Button icon="show" balance="show" />}
                </Box>
              )}
              {isDownMd && (
                <Box>
                  <IconButton
                    color="primary"
                    sx={{ ml: 1 }}
                    onClick={toggleDrawer}
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="top"
        open={drawerOpen}
        onClose={toggleDrawer}
        SlideProps={{ appear: false }}
        PaperProps={{ sx: { top: '96px' } }}
        sx={{
          top: '96px',
          '& .MuiBackdrop-root': {
            top: '96px',
          },
        }}
      >
        <Box display="flex">
          <Box flex="1" sx={{ p: 6 }}>
            {renderNavLinks('vertical')}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};
