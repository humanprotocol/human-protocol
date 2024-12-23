import { FC } from 'react';
import Link from '@mui/material/Link';

const NothingFound: FC = () => {
  return (
    <>
      <div className="nothing-found-title">Nothing found :(</div>
      <div className="nothing-found-desc">
        We couldn't find anything within this criteria.
        <br />
        Please search by <b>wallet address or escrow address.</b>
      </div>
      <Link href="/" underline="none">
        <div className="nothing-found-link">Back Home</div>
      </Link>
    </>
  );
};

export default NothingFound;
