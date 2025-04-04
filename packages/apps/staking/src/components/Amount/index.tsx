import { FC } from 'react';
import { Typography } from '@mui/material';

import { formatHmtAmount } from '../../utils/string';

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
    <Typography
      variant="h3"
      fontWeight={size === 'sm' ? 400 : 600}
      fontSize={size === 'sm' ? 24 : 48}
    >
      {formatHmtAmount(amount)}
    </Typography>
  );
};

export default Amount;
