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
import { setPreference, getPreference } from '../../utils/storage';
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
  // { title: 'Leaderboard', href: '/leaderboard' },
  { title: 'KV Store', href: '/kvstore' },
  { title: 'Faucet', href: '/faucet' },
  { title: 'HUMAN Website', href: 'https://humanprotocol.org', external: true },
];

const MyHMTButton = (props: ButtonProps) => {
  return (
    <Button
      variant="contained"
      color="primary"
      sx={{
        borderRadius: '40px',
        boxShadow: 'none',
        p: 1,
        pr: 2,
        display: 'none',
      }}
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

  const renderNavLinks = () => (
    <Stack direction="row" spacing={2}>
      {NAV_LINKS.map((nav) => (
        <Link
          key={nav.title}
          to={nav.href}
          target={nav.external ? '_blank' : '_self'}
          style={{ textDecoration: 'none', padding: '6px 8px' }}
        >
          <Typography color="primary" variant="body2" fontWeight={600}>
            {nav.title}
          </Typography>
        </Link>
      ))}
    </Stack>
  );

  const renderMobileLinks = () => (
    <Box>
      {NAV_LINKS.map((nav) => (
        <Link
          key={nav.title}
          to={nav.href}
          target={nav.external ? '_blank' : '_self'}
          style={{
            textDecoration: 'none',
            padding: '20px 32px',
            borderBottom: '1px solid #E9EBFA',
            display: 'block',
          }}
        >
          <Typography color="primary" variant="body2" fontWeight={400}>
            {nav.title}
          </Typography>
        </Link>
      ))}
    </Box>
  );
  const handleCloseWarning = () => {
    setPreference('HUMAN_ESCROW_DASHBOARD_SHOW_WARNING', false);
    setShowWarning(false);
  };

  useEffect(() => {
    const showWarning = getPreference(
      'HUMAN_ESCROW_DASHBOARD_SHOW_WARNING',
      true
    );
    setShowWarning(showWarning);
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
                  xs: '29px 24px',
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
                    <Box
                      component="img"
                      src={logoSvg}
                      alt="logo"
                      sx={{ width: { xs: '100px', md: '118px' } }}
                    />
                    <Typography
                      sx={{
                        fontSize: { xs: '14px', md: '16px' },
                        lineHeight: { xs: 1, md: 1.5 },
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
                    <Box display="flex" alignItems="center" gap={3}>
                      {/* {isDownLg && (
                        <IconButton color="primary" onClick={toggleSearchBox}>
                          <SearchIcon />
                        </IconButton>
                      )} */}
                      {renderNavLinks()}
                      {/* <ConnectButton /> */}
                      {address && <MyHMTButton href="/staking" />}
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
        PaperProps={{ sx: { top: '88px', bottom: '0px' } }}
        sx={{
          top: '88px',
          '& .MuiBackdrop-root': {
            top: '88px',
          },
        }}
      >
        <Box height="100%" position="relative">
          {renderMobileLinks()}
          {/* <Box px={4} py="26px">
            <ConnectButton />
          </Box> */}
          {address && (
            <Box px={4} py="26px">
              <MyHMTButton href="/staking" />
            </Box>
          )}
          <Box
            sx={{
              position: 'absolute',
              bottom: '32px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <SocialIcons />
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};
