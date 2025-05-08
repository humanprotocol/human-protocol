import Typography from '@mui/material/Typography';

import { useHMTPrice } from '../../services/api/use-hmt-price';

export function HMTPrice() {
  const { data, isError, isPending, isSuccess } = useHMTPrice();
  return (
    <div>
      <Typography variant="body1" component="p">
        HMT Price
      </Typography>
      <div className="count">
        {isSuccess && `$${data}`}
        {isPending && '...'}
        {isError && 'No data'}
      </div>
    </div>
  );
}
