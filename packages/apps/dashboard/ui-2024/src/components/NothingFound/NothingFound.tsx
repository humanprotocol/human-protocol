import { FC }  from 'react';
import PageWrapper from '@components/PageWrapper';
import Search from '@components/Search';
import Breadcrumbs from '@components/Breadcrumbs';
import Link from '@mui/material/Link';

const NothingFound: FC = () => {
  return (
    <PageWrapper>
			<Breadcrumbs title='Search Results' />
      <Search />
      <div className='nothing-found-title'>
        Nothing found :(
      </div>
      <div className='nothing-found-desc'>
        We couldn't find anything within this criteria.<br/>
        Please search by <b>wallet address or escrow address.</b>
      </div>
      <Link href="/" underline="none">
        <div className='nothing-found-link'>
          Back Home
        </div>
      </Link>
    </PageWrapper>
  );
};

export default NothingFound;