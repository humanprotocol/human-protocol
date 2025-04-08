import { FC, useState } from 'react';
import {
  AppBar,
  Box,
  Link as MuiLink,
  Toolbar,
  IconButton,
  Drawer,
  Typography,
  styled,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

import Account from '../Account';
import ConnectWallet from '../Wallet/ConnectWallet';
import StakeModal from '../modals/StakeModal';
import logoImg from '../../assets/logo.svg';
import { colorPalette } from '../../assets/styles/color-palette';
import { ROUTES } from '../../constants';
import NetworkSwitcher from '../NetworkSwitcher';

const NavLink = styled(MuiLink)({
  color: colorPalette.primary.main,
  padding: '6px 8px',
  fontSize: '14px',
  lineHeight: '150%',
  letterSpacing: '0.1px',
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',

  '@media (min-width: 900px) and (max-width: 1200px)': {
    padding: '6px 4px',
    fontSize: '12px',
  },
});

const DefaultHeader: FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const { isConnected } = useAccount();

  const toggleDrawer = (open: boolean) => {
    setMobileMenuOpen(open);
  };

  return (
    <AppBar
      className="container"
      position="static"
      sx={{ bgcolor: '#fff', boxShadow: 'none' }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          height: { xs: 64, md: 82 },
        }}
      >
        <Link
          to={ROUTES.DASHBOARD}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <img
            src={logoImg}
            alt="Staking Dashboard"
            style={{ width: 118, height: 28 }}
          />
          <Typography
            variant="body1"
            ml={1.5}
            display={{ xs: 'none', sm: 'block' }}
            sx={{ fontSize: { md: '14px', lg: '16px' } }}
          >
            Staking
          </Typography>
        </Link>
        <Box
          display={{ xs: 'none', md: 'flex' }}
          paddingY={{ sm: 0, md: 2.5 }}
          height="100%"
          alignItems="center"
          gap={{ md: 1, lg: 2 }}
        >
          <NavLink href={ROUTES.DASHBOARD}>Staking Overview</NavLink>
          <NavLink href={ROUTES.KVSTORE}>KV Store</NavLink>
          <NavLink href="https://dashboard.humanprotocol.org" target="_blank">
            Dashboard
          </NavLink>
          <NavLink href="https://humanprotocol.org" target="_blank">
            HUMAN Website
          </NavLink>
          <Button
            size="medium"
            variant="outlined"
            disabled={!isConnected}
            sx={{
              px: { md: 1, lg: 2 },
              fontSize: { md: '12px', lg: '14px' },
              height: '100%',
            }}
            onClick={() => isConnected && setStakeModalOpen(true)}
          >
            Stake HMT
          </Button>
          <NetworkSwitcher />
          {!isConnected && <ConnectWallet />}
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
              gap: 2,
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            <IconButton
              onClick={() => toggleDrawer(false)}
              sx={{
                color: 'primary.main',
                position: 'absolute',
                top: 10,
                right: 10,
              }}
            >
              <CloseIcon />
            </IconButton>
            <NetworkSwitcher />
            {isConnected && <Account />}
            {!isConnected && <ConnectWallet />}
            <MuiLink
              href={ROUTES.DASHBOARD}
              underline="none"
              onClick={() => toggleDrawer(false)}
            >
              Staking Overview
            </MuiLink>
            <MuiLink
              href={ROUTES.KVSTORE}
              underline="none"
              onClick={() => toggleDrawer(false)}
            >
              KV Store
            </MuiLink>
            <MuiLink
              href="https://dashboard.humanprotocol.org"
              underline="none"
              onClick={() => toggleDrawer(false)}
            >
              Dashboard
            </MuiLink>
            <MuiLink
              href="https://humanprotocol.org"
              underline="none"
              onClick={() => toggleDrawer(false)}
            >
              HUMAN Website
            </MuiLink>
            <Button
              size="medium"
              variant="outlined"
              disabled={!isConnected}
              onClick={() => {
                if (isConnected) {
                  setStakeModalOpen(true);
                  toggleDrawer(false);
                }
              }}
            >
              Stake HMT
            </Button>
          </Box>
        </Drawer>
      </Toolbar>
      <StakeModal
        open={stakeModalOpen}
        onClose={() => setStakeModalOpen(false)}
      />
    </AppBar>
  );
};

export default DefaultHeader;
