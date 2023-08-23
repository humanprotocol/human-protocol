import {
  Close as CloseIcon,
  Menu as MenuIcon,
  // Search as SearchIcon,
} from '@mui/icons-material';
import {
  Alert,
  AppBar,
  Box,
  Button,
  ButtonProps,
  Collapse,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAccount } from 'wagmi';
import { ConnectButton } from '../ConnectButton';
import { SearchBox } from '../SearchBox';
import { SocialIcons } from '../SocialIcons';
import logoSvg from 'src/assets/logo.svg';
import myHMTSvg from 'src/assets/my-hmt.svg';

type NavLink = {
  title: string;
  href: string;
  external?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { title: 'How to HUMAN', href: '/how-to-human' },
  { title: 'Leaderboard', href: '/leaderboard' },
  { title: 'KV Store', href: '/kvstore' },
  { title: 'HUMAN Website', href: 'https://humanprotocol.org', external: true },
];

const MyHMTButton = (props: ButtonProps) => {
  return (
    <Button
      variant="contained"
      color="primary"
      sx={{ borderRadius: '40px', boxShadow: 'none', p: 1, pr: 2 }}
      {...props}
    >
      <img src={myHMTSvg} alt="my-hmt" />
      <Typography variant="body2" fontWeight={600} sx={{ ml: 1 }}>
        My HMT
      </Typography>
    </Button>
  );
};

export const Header: FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const theme = useTheme();
  const isDownLg = useMediaQuery(theme.breakpoints.down('lg'));
  // const isDownMd = useMediaQuery(theme.breakpoints.down('md'));
  const { address } = useAccount();

  const [showWarning, setShowWarning] = useState(false);

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
          to={nav.href}
          target={nav.external ? '_blank' : '_self'}
          style={{ textDecoration: 'none' }}
        >
          <Typography color="primary" variant="body2" fontWeight={600}>
            {nav.title}
          </Typography>
        </Link>
      ))}
    </Stack>
  );

  const handleCloseWarning = () => {
    localStorage.setItem('HUMAN_ESCROW_DASHBOARD_SHOW_WARNING', 'false');
    setShowWarning(false);
  };

  useEffect(() => {
    const cacheValue = localStorage.getItem(
      'HUMAN_ESCROW_DASHBOARD_SHOW_WARNING'
    );
    if (cacheValue === 'false') {
      setShowWarning(false);
    } else {
      setShowWarning(true);
    }
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          background: 'rgba(255, 255, 255, 0.8)',
          boxShadow: 'none',
          backdropFilter: 'blur(9px)',
        }}
      >
        <Toolbar disableGutters>
          <Box sx={{ width: '100%' }}>
            <Collapse in={showWarning}>
              <Alert
                severity="warning"
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={handleCloseWarning}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
                sx={{
                  px: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  '& .MuiAlert-action': {
                    marginLeft: 0,
                    paddingTop: 0,
                  },
                }}
              >
                Beta Dashboard: minor inaccuracies may be present
              </Alert>
            </Collapse>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                height: '88px',
                boxSizing: 'border-box',
                padding: {
                  xs: '22px 8px 18px',
                  sm: '22px 28px 18px',
                  md: '29px 77px 20px 60px',
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
                    to="/"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    <img src={logoSvg} alt="logo" />
                    <Typography
                      sx={{
                        fontSize: '16px',
                        lineHeight: 1.5,
                        letterSpacing: '0.15px',
                      }}
                      color="primary"
                      ml="10px"
                    >
                      Dashboard
                    </Typography>
                  </Link>
                  {!isDownLg && showSearchBox && (
                    <Box sx={{ minWidth: '400px' }}>
                      <SearchBox />
                    </Box>
                  )}
                  {!isDownLg && (
                    <Box display="flex" alignItems="center" gap={2}>
                      {/* {isDownLg && (
                        <IconButton color="primary" onClick={toggleSearchBox}>
                          <SearchIcon />
                        </IconButton>
                      )} */}
                      {renderNavLinks()}
                      <ConnectButton />
                      {/* {address && <MyHMTButton href="/staking" />} */}
                    </Box>
                  )}
                  {isDownLg && (
                    <Box>
                      {/* <IconButton
                        color="primary"
                        sx={{ ml: 1 }}
                        onClick={toggleSearchBox}
                      >
                        <SearchIcon />
                      </IconButton> */}
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
            <Box mt={4} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <ConnectButton />
              {address && <MyHMTButton href="/staking" />}
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
