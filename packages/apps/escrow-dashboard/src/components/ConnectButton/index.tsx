import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuProps,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import React from 'react';
import profileSvg from 'src/assets/profile.svg';
import { ChainId, ESCROW_NETWORKS } from 'src/constants';
import useWalletBalance from 'src/hooks/useWalletBalance';
import { shortenAddress } from 'src/utils';
import { useAccount, useChainId } from 'wagmi';
import WalletModal from '../WalletModal';
import CopyLinkIcon from '../Icons/CopyLinkIcon';
import OpenInNewIcon from '../Icons/OpenInNewIcon';

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
    borderRadius: '16px',
    boxShadow:
      '0px 5px 5px -3px rgba(203, 207, 232, 0.5), 0px 8px 20px 1px rgba(133, 142, 198, 0.1), 0px 3px 64px 2px rgba(233, 235, 250, 0.2)',
    padding: 24,
  },
}));

export default function ConnectButton() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [modalOpen, setModalOpen] = React.useState(false);
  const toggleWalletModal = () => setModalOpen(!modalOpen);

  const walletBalance = useWalletBalance();

  const network = ESCROW_NETWORKS[chainId as ChainId];
  const accountUrl = `${network?.scanUrl}/address/${address}`;
  const tokenUrl = `${network?.scanUrl}/token/${network?.hmtAddress}`;

  if (!address) {
    return (
      <>
        <Button variant="outlined" color="primary" onClick={toggleWalletModal}>
          Connect Wallet
        </Button>
        <WalletModal open={modalOpen} onClose={toggleWalletModal} />
      </>
    );
  }

  return (
    <>
      <Button
        id="profile-button"
        sx={{ background: '#E1E2F7', py: 1, borderRadius: '40px', pr: 2 }}
        onClick={handleClick}
        aria-controls={open ? 'profile-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        endIcon={<ArrowDropDownIcon />}
      >
        <img src={profileSvg} alt="profile" />
        <Typography variant="body2" fontWeight={600} sx={{ ml: 1 }}>
          {shortenAddress(address)}
        </Typography>
      </Button>
      <ProfileMenu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'profile-button',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src={profileSvg} alt="profile" />
            <Typography variant="body2" fontWeight={600} sx={{ ml: 1 }}>
              {shortenAddress(address)}
            </Typography>
          </Box>
          <Stack direction="row" sx={{ ml: 3 }} spacing="10px">
            <IconButton
              color="primary"
              sx={{ background: '#F6F7FE' }}
              onClick={() => navigator.clipboard.writeText(address)}
            >
              <CopyLinkIcon />
            </IconButton>
            <IconButton
              color="primary"
              sx={{ background: '#F6F7FE' }}
              onClick={() => window.open(accountUrl)}
            >
              <OpenInNewIcon />
            </IconButton>
            <IconButton
              color="primary"
              sx={{ background: '#F6F7FE' }}
              onClick={() => window.open(tokenUrl)}
            >
              <OpenInNewIcon />
            </IconButton>
          </Stack>
        </Box>
        <Typography variant="h4" fontWeight={600} textAlign="center" mt={4}>
          {walletBalance?.formatted} HMT
        </Typography>
        <Typography
          color="text.secondary"
          variant="h5"
          textAlign="center"
          mt={1}
        >
          {walletBalance?.formatted && walletBalance?.usdPrice
            ? `$ ${Number(walletBalance.formatted) * walletBalance.usdPrice}`
            : ''}
        </Typography>
        <Stack sx={{ mt: 8 }} spacing={1.5}>
          <Button variant="outlined">Profile</Button>
          <Button variant="outlined">Another Option</Button>
        </Stack>
      </ProfileMenu>
    </>
  );
}
