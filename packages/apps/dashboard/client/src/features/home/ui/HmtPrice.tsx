import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import useHmtPrice from '@/shared/api/useHmtPrice';

const HmtPrice = () => {
  const { data, isError, isPending, isSuccess } = useHmtPrice();

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Typography variant="body1">HMT Price</Typography>
      <Typography variant="h6" component="p">
        {isSuccess && `$${data}`}
        {isPending && '...'}
        {isError && 'No data'}
      </Typography>
    </Box>
  );
};

export default HmtPrice;
