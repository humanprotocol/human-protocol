import { FC, PropsWithChildren }  from 'react';
import clsx from 'clsx';
import Header from '@components/Header';
import Footer from '@components/Footer';

const PageWrapper: FC<PropsWithChildren<{ violetHeader?: boolean, displaySearchBar?: boolean }>> = ({ children, violetHeader, displaySearchBar}) => {
  return (
    <>
      <Header displaySearchBar={displaySearchBar} />
      <div className={clsx('page-wrapper', { 'violet-header': violetHeader, 'search-white-header': displaySearchBar})}>
        <div className='container'>
          {children}
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default PageWrapper;