import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import { RoundedBox } from './RoundedBox';
import { JobLaunchResponse } from './types';

type LaunchSuccessProps = {
  jobResponse: JobLaunchResponse;
  onCreateNewEscrow: () => void;
};

export const LaunchSuccess = ({
  jobResponse,
  onCreateNewEscrow,
}: LaunchSuccessProps) => {
  return (
    <RoundedBox sx={{ py: 20, textAlign: 'center' }}>
      <Typography variant="h6" fontWeight={500} color="primary" mb={2}>
        Success!
      </Typography>
      <Typography variant="body2" color="primary">
        Your escrow has been created
      </Typography>
      <Typography variant="body2" color="primary">
        {jobResponse.escrowAddress}
      </Typography>
      <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
        <Button
          sx={{ mt: 5, minWidth: '200px' }}
          variant="contained"
          onClick={onCreateNewEscrow}
        >
          Create New Escrow
        </Button>
        <Button
          sx={{ mt: 5, minWidth: '200px' }}
          variant="contained"
          onClick={() => window.open(jobResponse.exchangeUrl, '_blank')}
        >
          Launch Exchange Oracle
        </Button>
      </Box>
    </RoundedBox>
  );
};
