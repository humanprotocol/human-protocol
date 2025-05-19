import React from 'react';
import { Box, Typography } from '@mui/material';
import { useAccount } from 'wagmi';

import { NetworkIcon } from './NetworkIcon';

const NetworkStatus: React.FC = () => {
  const { chain } = useAccount();

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" ml={4}>
      <Typography variant="body1" color="text.primary" mb={1}>
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
            color: 'text.primary',
            marginLeft: 1,
          }}
        >
          {chain?.name || 'Polygon'}
        </Typography>
      </Box>
    </Box>
  );
};

export default NetworkStatus;
