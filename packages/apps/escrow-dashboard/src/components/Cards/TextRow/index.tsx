import { Stack, Typography } from '@mui/material';
import React from 'react';

type TextRowProps = {
  label?: string;
  value?: string;
  minWidth?: number;
};

export function CardTextRow({ label, value, minWidth = 130 }: TextRowProps) {
  return (
    <Stack direction="row" spacing={3}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth }}>
        {label ? `${label} :` : ''}
      </Typography>
      <Typography variant="body2" color="primary">
        {value}
      </Typography>
    </Stack>
  );
}
