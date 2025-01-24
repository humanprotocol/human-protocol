import { FC } from 'react';
import clsx from 'clsx';

const ShadowIcon: FC<{
  className?: string;
  title?: string;
  img: string | JSX.Element;
}> = ({ className, title, img }) => {
  return (
    <div
      className={clsx('shadow-icon', className)}
      style={{ marginBottom: '20px' }}
    >
      <div className="shadow-icon__icon">
        {typeof img === 'string' ? <img src={img} alt="logo" /> : <>{img}</>}
      </div>
      <span>{title}</span>
    </div>
  );
};

export default ShadowIcon;
