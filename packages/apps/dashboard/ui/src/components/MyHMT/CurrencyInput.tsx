import { Box, Button, TextField } from '@mui/material';
import React, { FC } from 'react';

type CurrencyInputProps = {
  placeholder?: string;
};

export const CurrencyInput: FC<CurrencyInputProps> = ({ placeholder }) => {
  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        helperText="HMT Available: 0.000"
        placeholder={placeholder}
      />
      <Button
        variant="text"
        sx={{
          position: 'absolute',
          right: '10px',
          top: '12px',
          color: '#858EC6',
        }}
      >
        MAX
      </Button>
    </Box>
  );
};
