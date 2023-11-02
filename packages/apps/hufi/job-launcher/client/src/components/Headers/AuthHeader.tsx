import { LoadingButton } from '@mui/lab';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuProps,
  Toolbar,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MouseEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import * as authServices from '../../services/auth';
import { useAppDispatch, useAppSelector } from '../../state';
import { signOut } from '../../state/auth/reducer';
import { AccountCircleFilledIcon } from '../Icons/AccountCircleFilledIcon';
import { CardIcon } from '../Icons/CardIcon';
import { DollarSignIcon } from '../Icons/DollarSignIcon';
import { SettingsIcon } from '../Icons/SettingsIcon';
import { TransactionsIcon } from '../Icons/TransactionsIcon';
import WalletModal from '../WalletModal';

const ProfileMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    width: '240px',
    borderRadius: '4px',
    background: '#fff',
    boxShadow:
      '0px 3px 64px 2px rgba(233, 235, 250, 0.20), 0px 8px 20px 1px rgba(133, 142, 198, 0.10), 0px 5px 5px -3px rgba(203, 207, 232, 0.50)',
  },
}));

export const AuthHeader = () => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected } = useAccount();

  const handleClickCrypto = () => {
    setWalletModalOpen(true);
  };

  useEffect(() => {
    if (isConnected && walletModalOpen) {
      setWalletModalOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, refreshToken } = useAppSelector((state) => state.auth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogOut = async () => {
    setIsLoggingOut(true);
    try {
      if (refreshToken) {
        await authServices.signOut(refreshToken);
      }
    } catch (err) {
      console.log(err);
    }
    dispatch(signOut());
    setIsLoggingOut(false);
  };

  return (
    <AppBar
      sx={{
        background: '#FFFFFF',
        paddingLeft: '56px',
        boxShadow: 'none',
        pt: '10px',
      }}
    >
      <Toolbar>
        {/* Logo on the Left */}

        <Typography
          color="primary"
          sx={{ fontWeight: 800, fontSize: '40px', lineHeight: '62px' }}
        >
          <b>
            <Box component="span" color="secondary.light">
              Hu
            </Box>
            <Box component="span" color="primary.main">
              Fi
            </Box>
          </b>
        </Typography>
        {/* Spacer to push items to the right */}
        <Box sx={{ flexGrow: 1 }}></Box>
        <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
        <Button onClick={() => navigate('/campaigns/allcampaigns')}>
          All Campaigns
        </Button>
        <Button onClick={() => navigate('/campaigns/mycampaigns')}>
          My Campaigns
        </Button>
        <Button onClick={() => navigate('/campaigns/participating')}>
          Participating
        </Button>
        <LoadingButton
          variant="outlined"
          onClick={handleLogOut}
          loading={isLoggingOut}
        >
          Sign out
        </LoadingButton>

        {isConnected ? (
          <>
            {' '}
            <Box>
              <IconButton onClick={handleClick}>
                <AccountCircleFilledIcon />
              </IconButton>
            </Box>
          </>
        ) : (
          <Button
            variant="contained"
            sx={{ backgroundColor: 'secondary.light', margin: '15px' }}
            onClick={handleClickCrypto}
          >
            Connect Wallet
          </Button>
        )}
        <ProfileMenu
          id="profile-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{ disablePadding: true }}
        >
          <Box
            sx={{
              padding: '16px',
              borderBottom: '1px solid rgba(203, 207, 232, 0.80)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AccountCircleFilledIcon sx={{ fontSize: '48px' }} />
            <Box>
              {/* <Typography variant="body1" lineHeight={1.5}>
                Tony Wen
              </Typography> */}
              <Typography variant="body1">{user?.email}</Typography>
            </Box>
          </Box>
          <Box
            sx={{
              padding: '16px',
              borderBottom: '1px solid rgba(203, 207, 232, 0.80)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <DollarSignIcon sx={{ fontSize: '48px' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Balance
              </Typography>
              <Typography variant="body1" lineHeight={1.5}>
                {user?.balance?.amount || 0}{' '}
                {user?.balance?.currency?.toUpperCase()}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              padding: '16px',
              borderBottom: '1px solid rgba(203, 207, 232, 0.80)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <Link
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                cursor: 'pointer',
              }}
              to="/profile/top-up"
              onClick={handleClose}
            >
              <CardIcon /> Top up account
            </Link>
            <Link
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                cursor: 'pointer',
              }}
              to="/profile/transactions"
            >
              <TransactionsIcon /> My transactions
            </Link>
            <Link
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                cursor: 'pointer',
              }}
              to="/profile/settings"
            >
              <SettingsIcon /> Settings
            </Link>
          </Box>
          <Box sx={{ padding: '8px 16px' }}>
            <LoadingButton
              variant="contained"
              fullWidth
              onClick={handleLogOut}
              loading={isLoggingOut}
            >
              Log out
            </LoadingButton>
          </Box>
        </ProfileMenu>
        <WalletModal
          open={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
        />
      </Toolbar>
    </AppBar>
  );
};
