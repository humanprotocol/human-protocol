import { FC } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { NumericFormat } from 'react-number-format';

import { useHMTPrice } from '@/services/api/use-hmt-price';
import { useIsMobile } from '@/utils/hooks/use-breakpoints';

type Props = {
  balance?: number | null;
};

const HmtBalance: FC<Props> = ({ balance }) => {
  const { data, isError, isPending } = useHMTPrice();
  const isMobile = useIsMobile();

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
      <Typography variant="body2">
        <NumericFormat
          displayType="text"
          value={_balance}
          thousandSeparator=","
          decimalScale={isMobile ? 4 : 9}
        />
      </Typography>
      <Typography
        component="span"
        variant="body2"
        ml={0.5}
        color="text.secondary"
      >
        {`HMT($${balanceInDollars})`}
      </Typography>
    </Stack>
  );
};

export default HmtBalance;
