import { FC, PropsWithChildren } from 'react';
import clsx from 'clsx';
import { DefaultHeader } from '../Headers/DefaultHeader';
import Footer from '../Footer/Footer';

const PageWrapper: FC<
  PropsWithChildren<{
    violetHeader?: boolean;
    className?: string;
  }>
> = ({ children, violetHeader, className }) => {
  return (
    <div className="page-wrapper">
      <DefaultHeader />
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
