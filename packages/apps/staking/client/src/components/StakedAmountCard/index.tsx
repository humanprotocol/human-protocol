import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { useStake } from '../../hooks/useStake';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CustomTooltip from '../CustomTooltip';
import { colorPalette } from '../../assets/styles/color-palette';

type Props = {
  onStakeOpen: () => void;
  onUnstakeOpen: () => void;
};

const StakedAmountCard: React.FC<Props> = ({ onStakeOpen, onUnstakeOpen }) => {
  const { stakedAmount } = useStake();

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
        <CustomTooltip title="Tokens you have staked" arrow>
          <HelpOutlineIcon
            fontSize="small"
            sx={{ color: colorPalette.sky.main }}
          />
        </CustomTooltip>
      </Box>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Typography variant="h6" color="primary">
          Staked Amount
        </Typography>
      </Box>

      <Typography variant="h4" fontWeight="bold" fontSize={30}>
        {stakedAmount} HMT
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
        <Button variant="contained" onClick={onStakeOpen}>
          Stake
        </Button>
        <Button variant="outlined" onClick={onUnstakeOpen}>
          Unstake
        </Button>
      </Box>
    </Paper>
  );
};

export default StakedAmountCard;
