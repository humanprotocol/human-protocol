import { FC } from 'react';
import clsx from 'clsx';

const ShadowIcon: FC<{ className?: string; title?: string; img: string }> = ({
	className,
	title,
	img,
}) => {
	return (
		<div className={clsx('shadow-icon', className)}>
			<div className='shadow-icon__icon'>

			<img src={img} alt="logo" />
			</div>
			<span>{title}</span>
		</div>
	);
};

export default ShadowIcon;
