import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { FC } from 'react';

export const ReputationOracle: FC<SvgIconProps> = (props) => {
	return (
		<SvgIcon
			{...props}
			style={{
				width: '52',
				height: '52',
			}}
		>
			<svg
				width="52"
				height="52"
				viewBox="0 0 52 52"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<rect
					width="52"
					height="52"
					rx="10"
					fill="#1406B2"
					fillOpacity="0.04"
				/>
				<path
					d="M15.4706 20.3725L17.8315 21.7975L17.205 19.1119L19.2908 17.3049L16.5441 17.0719L15.4706 14.5391L14.3971 17.0719L11.6504 17.3049L13.7362 19.1119L13.1097 21.7975L15.4706 20.3725Z"
					fill="#24046D"
				/>
				<path
					d="M36.5297 20.3725L38.8906 21.7975L38.2641 19.1119L40.3499 17.3049L37.6032 17.0719L36.5297 14.5391L35.4562 17.0719L32.7095 17.3049L34.7953 19.1119L34.1688 21.7975L36.5297 20.3725Z"
					fill="#24046D"
				/>
				<path
					d="M25.9999 15.7886L28.3608 17.2135L27.7343 14.5279L29.8201 12.7209L27.0734 12.4879L25.9999 9.95508L24.9264 12.4879L22.1797 12.7209L24.2655 14.5279L23.639 17.2135L25.9999 15.7886Z"
					fill="#24046D"
				/>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M18.9007 26.1302V30.4977C18.9007 34.7551 21.9222 38.8099 26 40.0679C30.0777 38.8099 33.0992 34.7551 33.0992 30.4977V26.1302L26 23.1515L18.9007 26.1302ZM26 20.0789L16.0674 24.2464V30.4977C16.0674 36.2801 20.3053 41.6874 26 43.0002C31.6946 41.6874 35.9326 36.2801 35.9326 30.4977V24.2464L26 20.0789Z"
					fill="#24046D"
				/>
				<g clipPath="url(#clip0_1_16281)">
					<path
						d="M25.1722 32.2398L23.7078 30.7753L25.1722 29.3109L24.7265 28.8652L22.8164 30.7753L24.7265 32.6855L25.1722 32.2398ZM26.8276 32.2398L28.2921 30.7753L26.8276 29.3109L27.2733 28.8652L29.1834 30.7753L27.2733 32.6855L26.8276 32.2398Z"
						fill="#24046D"
					/>
				</g>
				<defs>
					<clipPath id="clip0_1_16281">
						<rect
							width="7.64045"
							height="7.64045"
							fill="white"
							transform="translate(22.1797 26.9551)"
						/>
					</clipPath>
				</defs>
			</svg>
		</SvgIcon>
	);
};