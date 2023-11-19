import { LooksOne, LooksTwo, Looks3 } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  FormControl,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface CreateCampaignModalProps {
  exchange: string;
  open: boolean;
  onClose: () => void;
}

export const JoinCampaignModal: React.FC<CreateCampaignModalProps> = ({
  exchange,
  open,
  onClose,
}) => {
  const [APIKEY, setAPIKEY] = useState('');
  const [APISECRET, setAPISECRET] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isSameAddress, setIsSameAdress] = useState(false);
  const { address } = useAccount();

  const handleJoinCampaign = () => {
    // Store APIKEY and APISECRET in localStorage
    localStorage.setItem('APIKEY', APIKEY);
    localStorage.setItem('APISECRET', APISECRET);

    // Only store walletAddress if it's not the same as the provided address
    if (walletAddress !== address) {
      localStorage.setItem('walletAddress', walletAddress);
    }

    // Here you'd also include any logic for actually joining the campaign
    // ...

    // Close the modal or provide feedback to the user
    onClose();
  };

  const handleChangeKey = (event: any) => {
    event.preventDefault();
    setAPIKEY(event.target.value);
  };
  const handleChangeSecret = (event: any) => {
    event.preventDefault();
    setAPISECRET(event.target.value);
  };
  const handleChangeAddress = (event: any) => {
    event.preventDefault();
    const inputAddress = event.target.value;
    setWalletAddress(inputAddress);

    // Set isSameAddress to true if the inputAddress matches the user's address
    if (inputAddress === address) {
      setIsSameAdress(true);
    } else {
      setIsSameAdress(false); // You need to add this line to handle when addresses don't match
    }
  };
  useEffect(() => {
    if (address) {
      setIsSameAdress(true);
      setWalletAddress(address);
    }

    if (localStorage.getItem('APIKEY')) {
      setAPIKEY(localStorage.getItem('APIKEY') || '');
    }
    if (localStorage.getItem('APISECRET')) {
      setAPISECRET(localStorage.getItem('APISECRET') || '');
    }
  }, [address]);

  return exchange === 'binance' ? (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          height: '600px',
          mx: 3,
          maxWidth: 'calc(100% - 32px)',
          borderRadius: '20px',
        },
      }}
    >
      <Box display="flex" maxWidth="784px">
        <Box
          width={{ xs: '0', md: '70%' }}
          display={{ xs: 'none', md: 'flex' }}
          sx={{
            backgroundColor: 'primary.main',
            boxSizing: 'border-box',
            flexDirection: 'column',
            height: '600px',
            justifyContent: 'space-between',
          }}
          px={9}
          py={6}
        >
          <Typography variant="h4" fontWeight={600} color="#fff">
            Join
            <br /> Campaign
          </Typography>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <LooksOne sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              Join the campaign now and enjoy the rewards.
            </Typography>
          </Box>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <LooksTwo sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              After Joining the campaign, provide liquidity to the token pair on
              the campaign's exchange.
            </Typography>
          </Box>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <Looks3 sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              Once confirmed, claim your rewards and spend them wisely, and
              remember a liquid market is a healthy market.
            </Typography>
          </Box>
          <Typography></Typography>
          <Typography></Typography>
        </Box>
        <Box
          p={5}
          display="flex"
          width="100%"
          flexDirection="column"
          gap={5}
          alignItems="left"
        >
          <IconButton sx={{ ml: 'auto', mb: 0.1 }} onClick={onClose}>
            <CloseIcon color="primary" />
          </IconButton>

          {/* 3. Reward Token */}
          <FormControl fullWidth variant="outlined">
            <TextField
              fullWidth
              autoComplete="off"
              label="API KEY"
              type="text"
              variant="outlined"
              defaultValue={APIKEY}
              onChange={handleChangeKey}
            />
          </FormControl>
          <TextField
            fullWidth
            label="API SECRET"
            type="password"
            autoComplete="off"
            variant="outlined"
            defaultValue={APISECRET}
            onChange={handleChangeSecret}
          />

          {/* Join Campaign Button */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleJoinCampaign}
          >
            Join Campaign
          </Button>
        </Box>
      </Box>
    </Dialog>
  ) : (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          height: '600px',
          mx: 3,
          maxWidth: 'calc(100% - 32px)',
          borderRadius: '20px',
        },
      }}
    >
      <Box display="flex" maxWidth="784px">
        <Box
          width={{ xs: '0', md: '70%' }}
          display={{ xs: 'none', md: 'flex' }}
          sx={{
            backgroundColor: 'primary.main',
            boxSizing: 'border-box',
            flexDirection: 'column',
            height: '600px',
            justifyContent: 'space-between',
          }}
          px={9}
          py={6}
        >
          <Typography variant="h4" fontWeight={600} color="#fff">
            Join
            <br /> Campaign
          </Typography>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <LooksOne sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              Join the campaign now and enjoy the rewards.
            </Typography>
          </Box>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <LooksTwo sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              After Joining the campaign, provide liquidity to the token pair on
              the campaign's exchange.
            </Typography>
          </Box>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <Looks3 sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              Once confirmed, claim your rewards and spend them wisely, and
              remember a liquid market is a healthy market.
            </Typography>
          </Box>
          <Typography></Typography>
          <Typography></Typography>
        </Box>
        <Box
          p={5}
          display="flex"
          width="100%"
          flexDirection="column"
          gap={5}
          alignItems="left"
        >
          <IconButton sx={{ ml: 'auto', mb: 0.1 }} onClick={onClose}>
            <CloseIcon color="primary" />
          </IconButton>

          {/* 3. Reward Token */}
          <FormControl fullWidth variant="outlined">
            <TextField
              fullWidth
              label="Wallet Address"
              type="text"
              variant="outlined"
              defaultValue={address}
              onChange={handleChangeAddress}
            />
          </FormControl>

          {/* Create Campaign Button */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleJoinCampaign}
            disabled={!isSameAddress}
          >
            Join Campaign
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
