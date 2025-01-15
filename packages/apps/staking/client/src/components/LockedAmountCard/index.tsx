import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Paper, Typography } from '@mui/material';
import React from 'react';
import { colorPalette } from '../../assets/styles/color-palette';
import { useStake } from '../../hooks/useStake';
import CustomTooltip from '../CustomTooltip';

const LockedAmountCard: React.FC = () => {
  const { lockedAmount, lockedUntil } = useStake();

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
        <CustomTooltip
          title="Tokens currently locked until a certain block"
          arrow
        >
          <HelpOutlineIcon
            fontSize="small"
            sx={{ color: colorPalette.sky.main }}
          />
        </CustomTooltip>
      </Box>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Typography variant="h6" color="primary">
          Locked Amount
        </Typography>
      </Box>

      <Typography variant="h4" fontWeight="bold" fontSize={30}>
        {lockedAmount} HMT
      </Typography>

      {lockedUntil !== undefined && lockedUntil > 0n && (
        <Typography variant="caption" color="textSecondary" pt={1}>
          Until block {lockedUntil.toString()}
        </Typography>
      )}
    </Paper>
  );
};

export default LockedAmountCard;
