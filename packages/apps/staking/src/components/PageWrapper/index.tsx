import { FC, PropsWithChildren } from 'react';

import DefaultHeader from '../Header';
import Footer from '../Footer';

const PageWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="layout">
      <DefaultHeader />
      <main className="container">{children}</main>
      <Footer />
    </div>
  );
};

export default PageWrapper;
