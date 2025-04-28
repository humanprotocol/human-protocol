import { FC, useState } from 'react';
import {
  Box,
  Link as MuiLink,
  Toolbar,
  IconButton,
  Drawer,
  Typography,
  styled,
  Button,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

import Account from '../Account';
import ConnectWallet from '../Wallet/ConnectWallet';
import Container from '../Container';
import StakeModal from '../modals/StakeModal';
import NetworkSwitcher from '../NetworkSwitcher';
import SwitchMode from '../SwitchMode';

import { ROUTES } from '../../constants';
import { LogoIcon } from '../../icons';

const NavLink = styled(MuiLink)(({ theme }) => {
  const isDarkMode = theme.palette.mode === 'dark';
  const color = isDarkMode
    ? theme.palette.text.primary
    : theme.palette.primary.main;

  return {
    color,
    padding: '6px 8px',
    fontSize: '14px',
    lineHeight: '150%',
    letterSpacing: '0.1px',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',

    '&:visited, &:hover': {
      color,
    },

    '@media (min-width: 900px) and (max-width: 1200px)': {
      padding: '6px 4px',
      fontSize: '12px',
    },
  };
});

const DefaultHeader: FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const { isConnected } = useAccount();
  const theme = useTheme();

  const isDarkMode = theme.palette.mode === 'dark';

  const toggleDrawer = (open: boolean) => {
    setMobileMenuOpen(open);
  };

  return (
    <Container
      component="header"
      display="flex"
      position="static"
      bgcolor="background.default"
      boxShadow="none"
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          height: { xs: 64, md: 82 },
          p: { xs: 0, sm: 0 },
        }}
      >
        <MuiLink
          component={Link}
          to={ROUTES.DASHBOARD}
          display="flex"
          alignItems="center"
        >
          <LogoIcon
            sx={{
              width: 118,
              height: 28,
              color: isDarkMode ? 'text.primary' : 'primary.light',
            }}
          />
          <Typography
            variant="body1"
            ml={1.5}
            display={{ xs: 'none', sm: 'block' }}
            sx={{ fontSize: { md: '14px', lg: '16px' } }}
            color="text.primary"
          >
            Staking
          </Typography>
        </MuiLink>
        <Box
          display={{ xs: 'none', md: 'flex' }}
          paddingY={{ sm: 0, md: 2.5 }}
          height="100%"
          alignItems="center"
          gap={{ md: 1, lg: 2 }}
        >
          <NavLink href={ROUTES.DASHBOARD}>Staking Overview</NavLink>
          <NavLink href={ROUTES.KVSTORE}>KV Store</NavLink>
          <NavLink
            href={import.meta.env.VITE_HEADER_LINK_DASHBOARD}
            target="_blank"
          >
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
              color: 'text.primary',
              borderColor: 'text.primary',
            }}
            onClick={() => isConnected && setStakeModalOpen(true)}
          >
            Stake HMT
          </Button>
          <NetworkSwitcher />
          {!isConnected && <ConnectWallet />}
          {isConnected && <Account />}
          <SwitchMode />
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
          PaperProps={{ sx: { width: '75%', bgcolor: 'background.default' } }}
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
            <SwitchMode />
          </Box>
        </Drawer>
      </Toolbar>
      <StakeModal
        open={stakeModalOpen}
        onClose={() => setStakeModalOpen(false)}
      />
    </Container>
  );
};

export default DefaultHeader;
