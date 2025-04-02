import React from 'react';
import { Box, Chip, Typography, useTheme } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAccount } from 'wagmi';

import { NetworkIcon } from './NetworkIcon';
import CustomTooltip from '../CustomTooltip';
import { colorPalette } from '../../assets/styles/color-palette';

const NetworkStatus: React.FC = () => {
  const { chain } = useAccount();
  const theme = useTheme();

  //if (!chain) return null;

  return (
    <Box display="flex" gap={1}>
      <CustomTooltip title="Network" arrow>
        <HelpOutlineIcon
          fontSize="medium"
          sx={{ color: colorPalette.sky.main }}
        />
      </CustomTooltip>
      <Box display="flex" flexDirection="column" alignItems="flex-start">
        <Typography variant="body1" color="primary" mb={1}>
          Network
        </Typography>
        <Chip
          avatar={
            <Box>
              <NetworkIcon chainId={chain?.id} />
            </Box>
          }
          label={
            <Typography
              variant="h3"
              sx={{
                padding: 0,
                fontWeight: 400,
                lineHeight: 1.5,
                color: theme.palette.primary.main,
                marginLeft: 1,
              }}
            >
              {chain?.name || 'Polygon'}
            </Typography>
          }
          sx={{
            backgroundColor: theme.palette.background.default,
            color: theme.palette.primary.contrastText,

            '& .MuiChip-avatar': {
              color: theme.palette.primary.main,
              margin: 0,
            },
            '& .MuiChip-label': {
              padding: 0,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default NetworkStatus;
