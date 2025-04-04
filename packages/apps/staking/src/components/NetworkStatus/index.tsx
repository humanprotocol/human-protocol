import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAccount } from 'wagmi';

import { NetworkIcon } from './NetworkIcon';
import CustomTooltip from '../CustomTooltip';
import { colorPalette } from '../../assets/styles/color-palette';

const NetworkStatus: React.FC = () => {
  const { chain } = useAccount();

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
                color: 'primary.main',
                marginLeft: 1,
              }}
            >
              {chain?.name || 'Polygon'}
            </Typography>
          }
          sx={{
            bgcolor: 'background.default',
            color: 'primary.contrastText',

            '& .MuiChip-avatar': {
              color: 'primary.main',
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
