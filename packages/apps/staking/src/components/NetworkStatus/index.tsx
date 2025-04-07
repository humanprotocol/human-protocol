import React from 'react';
import { Box, Typography } from '@mui/material';
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
        <Box display="flex" alignItems="center">
          <NetworkIcon chainId={chain?.id} />
          <Typography
            variant="h3"
            sx={{
              padding: 0,
              fontSize: { xs: 24, sm: 18, lg: 24 },
              fontWeight: 400,
              lineHeight: 1.5,
              color: 'primary.main',
              marginLeft: 1,
            }}
          >
            {chain?.name || 'Polygon'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default NetworkStatus;
