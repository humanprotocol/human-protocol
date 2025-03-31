import { FC } from 'react';
import { Box, Typography } from '@mui/material';

type Props = {
  amount: string | number;
  isConnected: boolean;
  size?: 'sm' | 'lg';
};

const Amount: FC<Props> = ({ amount, isConnected, size = 'sm' }) => {
  if (!isConnected) {
    return (
      <Typography
        component="span"
        variant="h3"
        fontSize={size === 'sm' ? 24 : 48}
      >
        --
      </Typography>
    );
  }

  return (
    <Box display="flex" gap={1.5} alignItems="baseline">
      <Typography
        variant="h3"
        fontWeight={size === 'sm' ? 400 : 600}
        fontSize={size === 'sm' ? 24 : 48}
      >
        {amount}
      </Typography>
      <Typography component="span" fontSize={size === 'sm' ? 20 : 34}>
        HMT
      </Typography>
    </Box>
  );
};

export default Amount;
