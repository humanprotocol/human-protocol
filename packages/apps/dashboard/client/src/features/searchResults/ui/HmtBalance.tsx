import { FC } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import useHmtPrice from '@/shared/api/useHmtPrice';
import { useIsMobile } from '@/shared/hooks/useBreakpoints';
import FormattedNumber from '@/shared/ui/FormattedNumber';

type Props = {
  balance?: number | null;
};

const HmtBalance: FC<Props> = ({ balance }) => {
  const { data, isError, isPending } = useHmtPrice();
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
        <FormattedNumber value={_balance} decimalScale={isMobile ? 4 : 9} />
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
