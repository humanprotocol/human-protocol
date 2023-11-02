import { LooksOne, LooksTwo, Looks3 } from '@mui/icons-material';
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
import React, { useMemo, useState } from 'react';
import { useTokenRate } from 'src/hooks/useTokenRate';

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
}

export const FundCampaignModal: React.FC<CreateCampaignModalProps> = ({
  open,
  onClose,
}) => {
  const [amount, setAmount] = useState('10');
  const { data: rate } = useTokenRate('hmt', 'usd');
  const totalAmount = useMemo(() => {
    if (!amount) return 0;
    return parseFloat(amount) * rate;
  }, [amount, rate]);
  const handleChangeAmount = (event: any) => {
    event.preventDefault();
    setAmount(event.target.value);
  };
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
            Fund your
            <br /> Campaign
          </Typography>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <LooksOne sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              The rewards must be funded in the rewards token chosen when
              creating the campaign.
            </Typography>
          </Box>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <LooksTwo sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              Choose the total amount of rewards you wish to fund the campaign
              with. These rewards will be distributed evenly by week for the
              course of the campiagn.
            </Typography>
          </Box>
          <Box display={{ xs: 'none', md: 'flex' }} color="text.secondary">
            <Looks3 sx={{ mr: '10px' }} />
            <Typography color="#fff" variant="caption">
              Once confirmed, sign the transaction to fund the campaign.
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

          {/* 4. amount*/}
          <TextField
            fullWidth
            label="Amount"
            type="number"
            variant="outlined"
            defaultValue={amount}
            onChange={handleChangeAmount}
          />
          <Box>
            <Typography my={2} color="primary.main" fontWeight={400}>
              Summary
            </Typography>
            <Box
              color="text.secondary"
              display="flex"
              width="100%"
              sx={{ justifyContent: 'space-between' }}
            >
              <Typography>Amount:</Typography>
              <Box display="flex" gap={2}>
                <Typography>{amount}</Typography>
                <Typography color="text.secondary">HMT</Typography>
              </Box>
            </Box>
            <Box
              color="text.secondary"
              display="flex"
              width="100%"
              sx={{ justifyContent: 'space-between' }}
            >
              <Typography>Fees:</Typography>
              <Box display="flex" gap={2}>
                <Typography>{parseFloat(amount) * 0.0013}</Typography>
                <Typography color="text.secondary">HMT</Typography>
              </Box>
            </Box>
            <Box
              color="text.primary"
              display="flex"
              width="100%"
              sx={{ justifyContent: 'space-between' }}
            >
              <Typography>Total:</Typography>
              <Box display="flex" gap={2}>
                <Typography>{totalAmount.toFixed(2)}</Typography>
                <Typography color="text.secondary">USD</Typography>
              </Box>
            </Box>
          </Box>

          {/* Create Campaign Button */}
          <Button variant="contained" color="primary" size="large">
            Fund Campaign
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
