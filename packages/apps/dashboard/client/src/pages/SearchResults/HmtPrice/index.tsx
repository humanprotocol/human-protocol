import { Typography, Stack } from '@mui/material';

import { useHMTPrice } from '@/services/api/use-hmt-price';

const HmtPrice = () => {
  const { data, isError, isPending, isSuccess } = useHMTPrice();

  return (
    <Stack flexDirection="row" whiteSpace="nowrap">
      <Typography component="span" variant="body2">
        $
      </Typography>
      <Typography variant="body2">
        {isError && 'N/A'}
        {isPending && '...'}
        {isSuccess && data}
      </Typography>
    </Stack>
  );
};

export default HmtPrice;
