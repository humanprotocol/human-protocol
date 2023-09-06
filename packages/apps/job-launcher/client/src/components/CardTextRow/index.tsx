import { Stack, Typography } from '@mui/material';
import { FC } from 'react';

type CardTextRowProps = {
  label?: string;
  value?: string | number;
  minWidth?: number;
};

export const CardTextRow: FC<CardTextRowProps> = ({
  label,
  value,
  minWidth = 130,
}) => {
  return (
    <Stack direction="row" spacing={3}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth }}>
        {label ? `${label} :` : ''}
      </Typography>
      <Typography
        variant="body2"
        color="primary"
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {value}
      </Typography>
    </Stack>
  );
};
