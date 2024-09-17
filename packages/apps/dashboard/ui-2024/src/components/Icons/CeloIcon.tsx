import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { FC } from 'react';

export const CeloIcon: FC<SvgIconProps> = (props) => {
	return (
		<SvgIcon
			width="24"
			height="15"
			viewBox="0 0 24 15"
			fill="none"
			sx={{ width: '24' }}
			{...props}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
			>
				<path
					d="M20 4H4V20.0409H19.9992V14.4417H17.3441C16.4288 16.4843 14.3685 17.907 12.0109 17.907C8.76048 17.907 6.12835 15.2454 6.12835 12.0092C6.12835 8.77291 8.7609 6.13432 12.0113 6.13432C14.4145 6.13432 16.4748 7.60314 17.3904 9.69139H20V4Z"
					fill="#320A8D"
				/>
			</svg>
		</SvgIcon>
	);
};

export default CeloIcon;
