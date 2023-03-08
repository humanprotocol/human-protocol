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
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import React, { useState } from 'react';
import logoSvg from 'src/assets/logo.svg';
import ConnectButton from 'src/components/ConnectButton';
import SearchBox from 'src/components/SearchBox';
import { SocialIcons } from 'src/components/SocialIcons';

type NavLink = {
  title: string;
  href: string;
  external?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { title: 'Leaderboard', href: '/leaderboard' },
  { title: 'KV Store', href: '/kvstore' },
  {
    title: 'Faucet',
    href: '/faucet',
  },
  { title: 'HUMAN Website', href: 'https://humanprotocol.org', external: true },
];

const Header: React.FC = (): React.ReactElement => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const theme = useTheme();
  const isDownLg = useMediaQuery(theme.breakpoints.down('lg'));
  const isDownMd = useMediaQuery(theme.breakpoints.down('md'));

  /**
   * @TODO: Remove the flag once it's implemented
   */
  const showSearchBox = false;

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const toggleSearchBox = () => setSearchOpen(!searchOpen);

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
          background: 'rgba(255, 255, 255, 0.8)',
          boxShadow: '0px 4px 120px rgba(218, 222, 240, 0.8)',
          backdropFilter: 'blur(9px)',
        }}
      >
        <Toolbar disableGutters>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: {
                xs: '30px 8px 26px',
                sm: '30px 28px 26px',
                md: '30px 52px 26px',
              },
            }}
          >
            {searchOpen ? (
              <Box display="flex" alignItems="center" width="100%">
                {showSearchBox && <SearchBox />}
                <IconButton
                  color="primary"
                  sx={{ ml: 2 }}
                  onClick={toggleSearchBox}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            ) : (
              <>
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
                    Dashboard
                  </Typography>
                </Link>
                {!isDownLg && (
                  <Box sx={{ minWidth: '400px' }}>
                    {showSearchBox && <SearchBox />}
                  </Box>
                )}
                {!isDownMd && (
                  <Box display="flex" alignItems="center" gap={3}>
                    {isDownLg && (
                      <IconButton color="primary" onClick={toggleSearchBox}>
                        <SearchIcon />
                      </IconButton>
                    )}
                    {renderNavLinks()}
                    <ConnectButton />
                  </Box>
                )}
                {isDownMd && (
                  <Box>
                    <IconButton
                      color="primary"
                      sx={{ ml: 1 }}
                      onClick={toggleSearchBox}
                    >
                      <SearchIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      sx={{ ml: 1 }}
                      onClick={toggleDrawer}
                    >
                      <MenuIcon />
                    </IconButton>
                  </Box>
                )}
              </>
            )}
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
            <Box mt={8}>
              <ConnectButton />
            </Box>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            sx={{ px: 2, background: 'rgba(246, 247, 254, 0.7);' }}
          >
            <SocialIcons direction="column" />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Header;
