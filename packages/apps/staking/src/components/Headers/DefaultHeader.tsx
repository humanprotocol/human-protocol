import { FC, useState } from 'react';
import {
  AppBar,
  Box,
  Link as MuiLink,
  Toolbar,
  IconButton,
  Drawer,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.svg';
import { useAccount } from 'wagmi';
import { Account } from '../Account';

export const DefaultHeader: FC = () => {
  const { isConnected } = useAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDrawer = (open: boolean) => {
    setMobileMenuOpen(open);
  };

  return (
    <AppBar
      position="static"
      sx={{ background: '#fff', boxShadow: 'none', px: 2 }}
    >
      <Toolbar
        sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src={logoImg} alt="Staking Dashboard" style={{ width: 250 }} />
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                ml: 1,
                display: { xs: 'none', sm: 'block' },
                marginLeft: '-100px',
              }}
            >
              Staking Dashboard
            </Typography>
          </Box>
        </Link>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          <MuiLink
            sx={{ fontSize: '14px', fontWeight: 600, mx: 2 }}
            href="https://dashboard.humanprotocol.org"
            underline="none"
          >
            Dashboard
          </MuiLink>
          <MuiLink
            sx={{ fontSize: '14px', fontWeight: 600, mx: 2 }}
            href="https://humanprotocol.org"
            underline="none"
          >
            HUMAN Website
          </MuiLink>

          {isConnected && <Account />}
        </Box>

        <IconButton
          edge="start"
          sx={{ display: { xs: 'block', md: 'none' }, color: 'primary.main' }}
          onClick={() => toggleDrawer(true)}
        >
          <MenuIcon />
        </IconButton>

        <Drawer
          anchor="right"
          open={mobileMenuOpen}
          onClose={() => toggleDrawer(false)}
          PaperProps={{ sx: { width: '75%' } }}
        >
          <Box
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
              <IconButton
                onClick={() => toggleDrawer(false)}
                sx={{ color: 'primary.main' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {isConnected && (
              <Box mb={2}>
                <Account />
              </Box>
            )}

            <MuiLink
              sx={{ fontSize: '18px', fontWeight: 600, my: 2 }}
              href="https://dashboard.humanprotocol.org"
              underline="none"
              onClick={() => toggleDrawer(false)}
            >
              Dashboard
            </MuiLink>

            <MuiLink
              sx={{ fontSize: '18px', fontWeight: 600, my: 2 }}
              href="https://humanprotocol.org"
              underline="none"
              onClick={() => toggleDrawer(false)}
            >
              HUMAN Website
            </MuiLink>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default DefaultHeader;
