import { Typography } from '@mui/material';
import React from 'react';

export const AuthFooter = () => {
  return (
    <Typography
      sx={{
        py: 5,
        textAlign: 'center',
        width: '100%',
        fontSize: '12px',
        position: 'relative',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
      color="text.secondary"
    >
      © 2023 HPF. HUMAN Protocol® is a registered trademark
    </Typography>
  );
};
