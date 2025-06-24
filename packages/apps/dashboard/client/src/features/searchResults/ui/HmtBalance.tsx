import { FC } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import useHmtPrice from '@/shared/api/useHmtPrice';

import TokenAmount from './TokenAmount';

type Props = {
  balance?: number | string | null;
};

const HmtBalance: FC<Props> = ({ balance }) => {
  const { data, isError, isPending } = useHmtPrice();

  if (isError) {
    return <span>N/A</span>;
  }

  if (isPending) {
    return <span>...</span>;
  }

  const _balance =
    Number(balance) < 1 ? Number(balance) * 1e18 : Number(balance);
  const balanceInDollars = balance ? (_balance * data).toFixed(2) : 0;

  return (
    <Stack flexDirection="row" whiteSpace="nowrap">
      <TokenAmount amount={_balance} alreadyParsed />
      <Typography component="span" variant="body2" color="text.secondary">
        {`($${balanceInDollars})`}
      </Typography>
    </Stack>
  );
};

export default HmtBalance;
