import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useHMTPrice } from '../../services/api/use-hmt-price';

const HMTPrice = () => {
  const { data, isError, isPending, isSuccess } = useHMTPrice();

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

export default HMTPrice;
