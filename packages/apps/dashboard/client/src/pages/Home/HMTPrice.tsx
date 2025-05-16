import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useHMTPrice } from '../../services/api/use-hmt-price';

export function HMTPrice() {
  const { data, isError, isPending, isSuccess } = useHMTPrice();

  return (
    <div>
      <Typography variant="body1" component="p">
        HMT Price
      </Typography>
      <Box display="flex" fontSize={20} fontWeight={500} mt={0.5}>
        {isSuccess && `$${data}`}
        {isPending && '...'}
        {isError && 'No data'}
      </Box>
    </div>
  );
}
