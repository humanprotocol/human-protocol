import { Button, Typography } from '@mui/material';
import React from 'react';
import { RoundedBox } from './RoundedBox';

type LaunchFailProps = {
  message: string;
  onBack: () => void;
};

export const LaunchFail = ({ message, onBack }: LaunchFailProps) => {
  return (
    <RoundedBox sx={{ py: 20, textAlign: 'center' }}>
      <Typography variant="h6" fontWeight={500} color="primary" mb={2}>
        Fail!
      </Typography>
      <Typography variant="body2" color="primary">
        {message}
      </Typography>
      <Button
        sx={{ mt: 5, minWidth: '200px' }}
        variant="contained"
        onClick={onBack}
      >
        Back
      </Button>
    </RoundedBox>
  );
};
