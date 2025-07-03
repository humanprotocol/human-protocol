import { Typography, Stack } from '@mui/material';

import useHmtPrice from '@/shared/api/useHmtPrice';

const HmtPrice = () => {
  const { data, isError, isPending, isSuccess } = useHmtPrice();

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
