import { Button, Typography } from '@mui/material';
import React from 'react';
import { RoundedBox } from './RoundedBox';

export const LaunchSuccess = () => {
  return (
    <RoundedBox sx={{ py: 20, textAlign: 'center' }}>
      <Typography variant="h6" fontWeight={500} color="primary" mb={2}>
        Success!
      </Typography>
      <Typography variant="body2" color="primary">
        Success message here. Next call to action call.
      </Typography>
      <Button sx={{ mt: 5, minWidth: '200px' }} variant="contained">
        CTA
      </Button>
    </RoundedBox>
  );
};
