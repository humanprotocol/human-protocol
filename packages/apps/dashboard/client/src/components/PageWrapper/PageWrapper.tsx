import { FC, PropsWithChildren } from 'react';

import clsx from 'clsx';

import Footer from '@/components/Footer';
import Header from '@/components/Header';

const PageWrapper: FC<
  PropsWithChildren<{
    violetHeader?: boolean;
    className?: string;
  }>
> = ({ children, violetHeader, className }) => {
  return (
    <div className="page-wrapper">
      <Header />
      <div
        className={clsx(className, {
          'violet-header': violetHeader,
        })}
      >
        <div className="container">{children}</div>
      </div>
      <Footer />
    </div>
  );
};

export default PageWrapper;
