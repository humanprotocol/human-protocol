import { Box, Paper, Typography } from '@mui/material';
import React from 'react';
import { colorPalette } from '../../assets/styles/color-palette';
import CustomTooltip from '../CustomTooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useStake } from '../../hooks/useStake';

const BalanceCard: React.FC = () => {
  const { tokenBalance } = useStake();

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
        <CustomTooltip title="Total balance available in your wallet" arrow>
          <HelpOutlineIcon
            fontSize="small"
            sx={{ color: colorPalette.sky.main }}
          />
        </CustomTooltip>
      </Box>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Typography variant="h6" color="primary">
          Wallet Balance
        </Typography>
      </Box>

      <Typography variant="h4" fontWeight="bold" fontSize={30}>
        {tokenBalance} HMT
      </Typography>
    </Paper>
  );
};

export default BalanceCard;
