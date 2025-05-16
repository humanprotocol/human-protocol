import { FC } from 'react';

import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

const NothingFound: FC = () => {
  return (
    <>
      <Typography variant="h2">Nothing found :(</Typography>
      <Typography variant="body1" mt={4}>
        We couldn't find anything within this criteria.
        <br />
        Please search by <strong>wallet address or escrow address.</strong>
      </Typography>
      <Link href="/" underline="none" mt={2}>
        <Typography color="secondary.main" fontWeight={600}>
          Back Home
        </Typography>
      </Link>
    </>
  );
};

export default NothingFound;
