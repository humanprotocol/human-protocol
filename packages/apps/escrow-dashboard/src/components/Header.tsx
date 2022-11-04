import * as React from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from 'react-router-dom';

import TokenPriceIndicator from './TokenPriceIndicator';

type NavLink = {
  title: string;
  href: string;
  external?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { title: 'Network', href: '/#network' },
  { title: 'Token', href: '/#token' },
  { title: 'Leaderboard', href: '/#leaderboard' },
  { title: 'HUMAN Website', href: 'https://humanprotocol.org', external: true },
];

const Header: React.FC = (): React.ReactElement => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

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
            <Box display="flex" alignItems="center">
              <img src="/images/logo.svg" alt="logo" />
              <Typography variant="h6" color="primary" ml="10px">
                Scan
              </Typography>
            </Box>
            {!isMobile && (
              <Box display="flex" sx={{ mx: 'auto' }}>
                {NAV_LINKS.map((nav) => (
                  <Link
                    key={nav.title}
                    href={nav.href}
                    target={nav.external ? '_blank' : '_self'}
                    sx={{ textDecoration: 'none', ml: '28px' }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {nav.title}
                    </Typography>
                  </Link>
                ))}
              </Box>
            )}
            <Box display="flex" alignItems="center" ml={isMobile ? 'auto' : 0}>
              <TokenPriceIndicator />
            </Box>
            {isMobile && (
              <>
                <IconButton
                  color="primary"
                  sx={{ ml: 1 }}
                  onClick={handleClick}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    'aria-labelledby': 'basic-button',
                  }}
                >
                  {NAV_LINKS.map((nav) => (
                    <MenuItem key={nav.title} onClick={handleClose}>
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
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
