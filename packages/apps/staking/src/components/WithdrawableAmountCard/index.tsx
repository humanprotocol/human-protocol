import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { colorPalette } from '../../assets/styles/color-palette';
import { useStakeContext } from '../../contexts/stake';
import CustomTooltip from '../CustomTooltip';

const WithdrawableAmountCard: React.FC = () => {
  const { withdrawableAmount, handleWithdraw } = useStakeContext();
  const [loading, setLoading] = useState(false);

  const handleWithdrawClick = async () => {
    setLoading(true);
    try {
      await handleWithdraw();
    } catch (error) {
      console.error('Error during withdrawal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        height: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        borderRadius: '20px',
        boxShadow: 'none',
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'absolute', top: 30, right: 30 }}>
        <CustomTooltip title="Tokens available for withdrawal" arrow>
          <HelpOutlineIcon
            fontSize="small"
            sx={{ color: colorPalette.sky.main }}
          />
        </CustomTooltip>
      </Box>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Typography variant="h6" color="primary">
          Withdrawable Amount
        </Typography>
      </Box>

      <Typography variant="h4" fontWeight="bold" fontSize={30}>
        {withdrawableAmount} HMT
      </Typography>

      <Button
        variant="contained"
        onClick={handleWithdrawClick}
        disabled={Number(withdrawableAmount) <= 0 || loading}
        sx={{ mt: 'auto' }}
      >
        {loading ? <CircularProgress size={24} /> : 'Withdraw'}
      </Button>
    </Paper>
  );
};

export default WithdrawableAmountCard;
