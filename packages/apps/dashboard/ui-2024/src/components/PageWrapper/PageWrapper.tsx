import { FC, PropsWithChildren }  from 'react';
import Header from '@components/Header';
import Footer from '@components/Footer';

const PageWrapper: FC<PropsWithChildren<{ violetHeader?: boolean }>> = ({ children, violetHeader}) => {
  return (
    <>
      <Header/>
      <div className={`page-wrapper ${violetHeader ? 'violet-header' : ''}`}>
        <div className='container'>
          {children}
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default PageWrapper;