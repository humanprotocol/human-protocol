import { LooksOne, LooksTwo, Looks3, Looks4 } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  open,
  onClose,
}) => {
  return (
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
          width={{ xs: '0', md: '50%' }}
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
            Create
            <br /> Campaign
          </Typography>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <LooksOne sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              Choose the exchange you wish to reward users for providing
              liquidity on.
            </Typography>
          </Box>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <LooksTwo sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              Select the token pair you want liquidity created for. You can
              paste the token address here too.
            </Typography>
          </Box>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <Looks3 sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              Choose which token you wish to reward your users in.
            </Typography>
          </Box>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <Looks4 sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              Choose the date you wish this campaign to finish and have
              distributed all the rewards by.
            </Typography>
          </Box>
          <Typography></Typography>
          <Typography></Typography>
        </Box>
        <Box
          p={4}
          display="flex"
          flexDirection="column"
          gap={5}
          alignItems="left"
        >
          <IconButton sx={{ ml: 'auto', mb: 0.1 }} onClick={onClose}>
            <CloseIcon color="primary" />
          </IconButton>
          {/* 1. Choose the exchange */}
          <FormControl fullWidth variant="outlined">
            <InputLabel id="exchange-label">Exchange</InputLabel>
            <Select
              labelId="exchange-label"
              label="Exchange"
              defaultValue="UniSwap (ETH)"
            >
              <MenuItem value="UniSwap (ETH)">UniSwap (ETH)</MenuItem>
              {/* Add other exchanges here */}
            </Select>
          </FormControl>

          {/* 2. Select the token pair */}
          <Box display="flex" gap={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="token1-label">Token 1</InputLabel>
              <Select
                labelId="token1-label"
                label="Token 1"
                defaultValue="WETH"
              >
                <MenuItem value="WETH">WETH</MenuItem>
                {/* Add other tokens here */}
              </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="token2-label">Token 2</InputLabel>
              <Select labelId="token2-label" label="Token 2" defaultValue="HMT">
                <MenuItem value="HMT">HMT</MenuItem>
                {/* Add other tokens here */}
              </Select>
            </FormControl>
          </Box>

          {/* 3. Reward Token */}
          <FormControl fullWidth variant="outlined">
            <InputLabel id="reward-token-label">Reward Token</InputLabel>
            <Select
              labelId="reward-token-label"
              label="Reward Token"
              defaultValue="HMT"
            >
              <MenuItem value="HMT">HMT</MenuItem>
              {/* Add other tokens here */}
            </Select>
          </FormControl>

          {/* 4. Start and End Date */}
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              variant="outlined"
              defaultValue="2023-11-12"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              fullWidth
              label="End Date"
              type="date"
              variant="outlined"
              defaultValue="2023-11-12"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>

          {/* Create Campaign Button */}
          <Button variant="contained" color="primary" size="large">
            Create Campaign
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
