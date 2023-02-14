import { Button, Typography } from '@mui/material';
import React from 'react';
import { RoundedBox } from './RoundedBox';

type LaunchSuccessProps = {
  escrowAddress: string;
};

export const LaunchSuccess = ({ escrowAddress }: LaunchSuccessProps) => {
  return (
    <RoundedBox sx={{ py: 20, textAlign: 'center' }}>
      <Typography variant="h6" fontWeight={500} color="primary" mb={2}>
        Success!
      </Typography>
      <Typography variant="body2" color="primary">
        Your escrow has been created
      </Typography>
      <Typography variant="body2" color="primary">
        {escrowAddress}
      </Typography>
      <Button
        sx={{ mt: 5, minWidth: '200px' }}
        variant="contained"
        onClick={() => window.location.reload()}
      >
        CTA
      </Button>
    </RoundedBox>
  );
};
