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

const UnstakeModal: React.FC<Props> = ({ open, onClose }) => {
  const { stakedAmount, lockedAmount, handleUnstake } = useStakeContext();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const availableAmount = Number(stakedAmount) - Number(lockedAmount);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (Number(value) <= availableAmount) {
      setAmount(value);
    }
  };

  const handleMaxClick = () => {
    setAmount(availableAmount.toString());
  };

  const handleUnstakeClick = async () => {
    setLoading(true);
    try {
      await handleUnstake(amount);
      onClose();
      setAmount('');
    } catch (error) {
      console.error('Error during unstaking:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal open={open} onClose={onClose}>
      <Typography variant="h6" mb={2}>
        Unstake
      </Typography>

      <Typography variant="body2" color="textSecondary" mb={1}>
        Available Amount: {availableAmount} HMT
      </Typography>

      <TextField
        fullWidth
        label="Amount"
        type="number"
        value={amount}
        onChange={handleInputChange}
        inputProps={{ max: availableAmount, min: 0 }}
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
        onClick={handleUnstakeClick}
        disabled={!amount || Number(amount) <= 0 || loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Unstake'}
      </Button>
    </BaseModal>
  );
};

export default UnstakeModal;
