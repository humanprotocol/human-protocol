import type { FC } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useIsMobile } from '@/shared/hooks/useBreakpoints';
import FormattedNumber from '@/shared/ui/FormattedNumber';

type Props = {
  amount: number | string | null | undefined;
  tokenSymbol?: string | null | undefined;
  alreadyParsed?: boolean;
};

const TokenAmount: FC<Props> = ({
  amount,
  tokenSymbol = 'HMT',
  alreadyParsed = false,
}) => {
  const isMobile = useIsMobile();

  return (
    <Stack direction="row" whiteSpace="nowrap">
      <Typography variant="body2">
        <FormattedNumber
          value={(Number(amount) || 0) * (alreadyParsed ? 1 : 1e18)}
          decimalScale={isMobile ? 4 : 9}
        />
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        component="span"
        ml={0.5}
      >
        {tokenSymbol}
      </Typography>
    </Stack>
  );
};

export default TokenAmount;
