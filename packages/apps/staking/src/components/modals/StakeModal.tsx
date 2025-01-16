import {
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useStakeContext } from '../../contexts/stake';
import BaseModal from './BaseModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

const StakeModal: React.FC<Props> = ({ open, onClose }) => {
  const { handleStake, tokenBalance } = useStakeContext();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStakeAction = async () => {
    setLoading(true);
    try {
      await handleStake(amount);
      onClose();
      setAmount('');
    } catch (error) {
      console.error('Error during staking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(tokenBalance.toString());
  };

  return (
    <BaseModal open={open} onClose={onClose}>
      <Typography variant="h6" mb={2}>
        Add Stake
      </Typography>

      <Typography variant="body2" color="textSecondary" mb={1}>
        Available amount: {tokenBalance} HMT
      </Typography>

      <TextField
        fullWidth
        label="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputProps={{ max: tokenBalance, min: 0 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Button
                variant="contained"
                size="large"
                onClick={handleMaxClick}
                sx={{ fontSize: '0.75rem', padding: '2px 8px' }}
              >
                MAX
              </Button>
            </InputAdornment>
          ),
        }}
      />

      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleStakeAction}
        disabled={!amount || Number(amount) <= 0 || loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Stake'}
      </Button>
    </BaseModal>
  );
};

export default StakeModal;
