import { FC, PropsWithChildren } from 'react';

import clsx from 'clsx';

import Footer from '@/widgets/footer';
import Header from '@/widgets/header';

import ErrorBanner from './ErrorBanner';

const PageWrapper: FC<
  PropsWithChildren<{
    violetHeader?: boolean;
    className?: string;
    errorBanner?: boolean;
  }>
> = ({ children, violetHeader, className, errorBanner }) => {
  return (
    <div className="page-wrapper">
      {errorBanner && <ErrorBanner />}
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
