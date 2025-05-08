import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useHMTPrice } from '@services/api/use-hmt-price';

export const HMTBalance = ({ HMTBalance }: { HMTBalance: number }) => {
  const { data, isError, isPending } = useHMTPrice();

  if (isError) {
    return <span>N/A</span>;
  }

  if (isPending) {
    return <span>...</span>;
  }
  const HMTBalanceInDollars = HMTBalance * data;

  return (
    <Stack flexDirection="row" whiteSpace="nowrap">
      <Typography variant="body2">{HMTBalance}</Typography>
      <Typography
        component="span"
        variant="body2"
        ml={0.5}
        color="text.secondary"
      >
        {`HMT($${HMTBalanceInDollars.toFixed(2)})`}
      </Typography>
    </Stack>
  );
};
