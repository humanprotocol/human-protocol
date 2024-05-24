import { FC }  from 'react';
import clsx from 'clsx';

const ShadowIcon: FC<{ className?: string, title?: string, img: string }> = ({ className, title, img }) => {
  return (
    <div className={clsx('shadow-icon', className)}>
      <img src={img} alt="logo"/>
      <span>{title}</span>
    </div>
  );
};

export default ShadowIcon;