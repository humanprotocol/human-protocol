import { FC, PropsWithChildren } from 'react';
import clsx from 'clsx';

import DefaultHeader from '../Headers/DefaultHeader';
import Footer from '../Footer';

type Props = {
  violetHeader?: boolean;
  className?: string;
};

const PageWrapper: FC<PropsWithChildren<Props>> = ({
  violetHeader,
  className,
  children,
}) => {
  return (
    <div className="layout">
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
