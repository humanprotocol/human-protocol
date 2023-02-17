import { Box, Typography } from '@mui/material';
import React from 'react';
import { RoundedBox } from './RoundedBox';

export const Launch = () => {
  return (
    <RoundedBox sx={{ py: 20, display: 'flex', justifyContent: 'center' }}>
      <Box>
        <Typography variant="h6" fontWeight={500} color="primary">
          Creating Job
        </Typography>
        <Typography variant="h6" fontWeight={500} color="primary">
          Setting Up Escrow
        </Typography>
        <Typography
          variant="h6"
          fontWeight={500}
          color="primary"
          sx={{ opacity: 0.2 }}
        >
          Funding Escrow
        </Typography>
        <Typography
          variant="h6"
          fontWeight={500}
          color="primary"
          sx={{ opacity: 0.2 }}
        >
          Setting Up Trusted Handler
        </Typography>
      </Box>
    </RoundedBox>
  );
};
