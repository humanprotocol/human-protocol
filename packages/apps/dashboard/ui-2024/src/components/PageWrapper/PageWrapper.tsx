import { FC, PropsWithChildren }  from 'react';
import clsx from 'clsx';
import Header from '@components/Header';
import Footer from '@components/Footer';

const PageWrapper: FC<PropsWithChildren<{ violetHeader?: boolean, searchWhite?: boolean }>> = ({ children, violetHeader, searchWhite}) => {
  return (
    <>
      <Header searchWhite={searchWhite} />
      <div className={clsx('page-wrapper', { 'violet-header': violetHeader, 'search-white-header': searchWhite})}>
        <div className='container'>
          {children}
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default PageWrapper;