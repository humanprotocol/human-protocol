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
import React, { useState } from 'react';
import { useNetwork, useAccount } from 'wagmi';
import { useCampaignsPolling } from 'src/hooks/useCampaignsPolling';
import { createCampaign } from 'src/services/campaign'; // Update the import path as necessary

// ...other imports if necessary...

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  open,
  onClose,
}) => {
  const { chain } = useNetwork();
  const { address } = useAccount();
  const { refreshCampaigns } = useCampaignsPolling();

  // State for the campaign form
  const [campaignForm, setCampaignForm] = useState({
    exchange: '',
    tokenA: '',
    tokenB: '',
    rewardToken: '',
    startDate: '',
    endDate: '',
  });

  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form field changes
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement> | any
  ) => {
    const { name, value } = event.target;
    setCampaignForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const startBlock: number = Math.floor(
        new Date(campaignForm.startDate).getTime() / 1000
      );
      const endBlock: number = Math.floor(
        new Date(campaignForm.endDate).getTime() / 1000
      );
      const campaignDuration: number = endBlock - startBlock;

      if (chain && address)
        await createCampaign(chain.id, {
          ...campaignForm,
          startBlock: startBlock,
          endBlock: endBlock,
          requesterDescription: address.toString(),
          exchangeName: campaignForm.exchange,
          tokenA: campaignForm.tokenA,
          tokenB: campaignForm.tokenB,
          fundAmount: Number(amount),
          campaignDuration: campaignDuration,
          type: 'CAMPAIGN',
        });
      refreshCampaigns(); //refressh campaigns
      onClose(); // Close modal on success
    } catch (error) {
      console.error('Error creating campaign:', error);
      // Handle errors (show an alert or a notification to the user)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          height: '700px',
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
            height: '700px',
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
            <InputLabel id="exchange">Exchange</InputLabel>
            <Select
              labelId="exchange"
              label="Exchange"
              value={campaignForm.exchange}
              name="exchange"
              onChange={handleInputChange}
              required
            >
              <MenuItem value="binance">Binance</MenuItem>
              <MenuItem value="unispwap-ethereum">UniSwap (ETH)</MenuItem>
              <MenuItem value="uniswap-polygon">UniSwap (Polygon)</MenuItem>
              <MenuItem value="pancakeswap-bsc">Pancakeswap (bsc)</MenuItem>
              {/* Add other exchanges here */}
            </Select>
          </FormControl>

          {/* 2. Select the token pair */}
          <Box display="flex" gap={2}>
            <FormControl fullWidth variant="outlined">
              <TextField
                name="tokenA"
                value={campaignForm.tokenA}
                onChange={handleInputChange}
                label="Token A"
                required
              />
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <TextField
                name="tokenB"
                value={campaignForm.tokenB}
                onChange={handleInputChange}
                label="Token B"
                required
              />
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
              name="startDate"
              value={campaignForm.startDate}
              onChange={handleInputChange}
              label="Start Date"
              type="date"
              variant="outlined"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              fullWidth
              name="endDate"
              value={campaignForm.endDate}
              onChange={handleInputChange}
              label="End Date"
              type="date"
              variant="outlined"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
          {/* Amount Input */}
          <TextField
            fullWidth
            label="Amount"
            variant="outlined"
            value={amount}
            onChange={handleAmountChange}
            required
            helperText="Enter the inital fund for the campaign"
            // Additional props as needed
          />
          {/* Submit Button */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Campaign'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
