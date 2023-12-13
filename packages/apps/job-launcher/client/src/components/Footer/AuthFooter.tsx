import { Typography } from '@mui/material';
import React from 'react';

export const AuthFooter = () => {
  return (
    <Typography
      sx={{ py: 5, textAlign: 'right', width: '100%', fontSize: '12px' }}
      color="text.secondary"
    >
      © 2021 HPF. HUMAN Protocol® is a registered trademark
    </Typography>
  );
};
