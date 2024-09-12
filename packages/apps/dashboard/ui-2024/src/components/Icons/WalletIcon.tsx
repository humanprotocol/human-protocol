import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { FC } from 'react';

export const WalletIcon: FC<SvgIconProps> = (props) => {
	return (
		<SvgIcon
			{...props}
			style={{
				width: '130',
				height: '130',
			}}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="130"
				height="130"
				viewBox="0 0 130 130"
				fill="none"
			>
				<g filter="url(#filter0_d_1100_5433)">
					<path
						d="M98 41C98 59.2254 83.2254 74 65 74C46.7746 74 32 59.2254 32 41C32 22.7746 46.7746 8 65 8C83.2254 8 98 22.7746 98 41Z"
						fill="url(#paint0_radial_1100_5433)"
					/>
				</g>
				<g filter="url(#filter1_d_1100_5433)">
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M65 69.9304C80.9778 69.9304 93.9304 56.9778 93.9304 41C93.9304 25.0222 80.9778 12.0696 65 12.0696C49.0222 12.0696 36.0696 25.0222 36.0696 41C36.0696 56.9778 49.0222 69.9304 65 69.9304ZM65 74C83.2254 74 98 59.2254 98 41C98 22.7746 83.2254 8 65 8C46.7746 8 32 22.7746 32 41C32 59.2254 46.7746 74 65 74Z"
						fill="url(#paint1_linear_1100_5433)"
					/>
				</g>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M55.615 34.3625C55.8631 34.0318 56.2152 33.794 56.6147 33.6875L72.3849 29.4821C75.5591 28.6356 78.6732 31.0281 78.6732 34.3133L78.6732 34.4467C80.4627 35.208 81.7175 36.9824 81.7175 39.0498V39.8517C83.0931 40.4843 84.0481 41.8745 84.0481 43.4877V44.8097C84.0481 46.4229 83.0931 47.8131 81.7175 48.4457V50.0244C81.7175 52.7858 79.479 55.0244 76.7175 55.0244H57.9746C55.2132 55.0244 52.9746 52.7858 52.9746 50.0244V39.0498C52.9746 37.2385 53.9378 35.6522 55.3798 34.775C55.4382 34.6328 55.5162 34.4943 55.615 34.3625Z"
					fill="url(#paint2_linear_1100_5433)"
				/>
				<rect
					x="49.6898"
					y="31.1298"
					width="27.5429"
					height="20.5514"
					rx="4.4"
					stroke="#320A8D"
					strokeWidth="1.2"
				/>
				<rect
					x="69.1107"
					y="37.3441"
					width="10.4525"
					height="8.12203"
					rx="3.4"
					fill="#DFE4F5"
					stroke="#320A8D"
					strokeWidth="1.2"
				/>
				<circle cx="72.395" cy="41.4053" r="0.776836" fill="#320A8D" />
				<mask id="path-7-inside-1_1100_5433" fill="white">
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M52.7297 29.8047C52.3302 29.9112 51.9781 30.149 51.7301 30.4797C51.323 31.0225 51.2697 31.6797 51.48 32.236C52.2396 31.7703 53.1333 31.5018 54.0896 31.5018H72.9796C73.5673 31.5018 74.1313 31.6032 74.6552 31.7895C74.7421 31.4202 74.7882 31.0343 74.7882 30.6364L74.7882 30.4305C74.7882 27.1453 71.6741 24.7528 68.4999 25.5993L52.7297 29.8047Z"
					/>
				</mask>
				<path
					d="M51.7301 30.4797L52.6901 31.1997H52.6901L51.7301 30.4797ZM52.7297 29.8047L53.0389 30.9642H53.0389L52.7297 29.8047ZM51.48 32.236L50.3575 32.6603L50.8704 34.0173L52.1072 33.2591L51.48 32.236ZM74.6552 31.7895L74.2531 32.9201L75.5162 33.3692L75.8233 32.0644L74.6552 31.7895ZM74.7882 30.6364L73.5882 30.6364V30.6364H74.7882ZM74.7882 30.4305L75.9882 30.4305V30.4305L74.7882 30.4305ZM68.4999 25.5993L68.8091 26.7588L68.4999 25.5993ZM52.6901 31.1997C52.7766 31.0843 52.8995 31.0013 53.0389 30.9642L52.4205 28.6452C51.7609 28.8211 51.1796 29.2136 50.7701 29.7597L52.6901 31.1997ZM52.6025 31.8118C52.5269 31.6118 52.5467 31.3909 52.6901 31.1997L50.7701 29.7597C50.0993 30.654 50.0125 31.7477 50.3575 32.6603L52.6025 31.8118ZM52.1072 33.2591C52.6835 32.9057 53.3609 32.7018 54.0896 32.7018V30.3018C52.9057 30.3018 51.7958 30.6348 50.8528 31.213L52.1072 33.2591ZM54.0896 32.7018H72.9796V30.3018H54.0896V32.7018ZM72.9796 32.7018C73.4284 32.7018 73.8566 32.7791 74.2531 32.9201L75.0572 30.6588C74.4061 30.4273 73.7062 30.3018 72.9796 30.3018V32.7018ZM73.5882 30.6364C73.5882 30.9413 73.5529 31.2349 73.4871 31.5146L75.8233 32.0644C75.9313 31.6055 75.9882 31.1274 75.9882 30.6364H73.5882ZM73.5882 30.4305L73.5882 30.6364L75.9882 30.6365L75.9882 30.4305L73.5882 30.4305ZM68.8091 26.7588C71.2215 26.1155 73.5882 27.9338 73.5882 30.4305L75.9882 30.4305C75.9882 26.3569 72.1267 23.3902 68.1907 24.4398L68.8091 26.7588ZM53.0389 30.9642L68.8091 26.7588L68.1907 24.4398L52.4205 28.6452L53.0389 30.9642Z"
					fill="#320A8D"
					mask="url(#path-7-inside-1_1100_5433)"
				/>
				<defs>
					<filter
						id="filter0_d_1100_5433"
						x="0"
						y="0"
						width="130"
						height="130"
						filterUnits="userSpaceOnUse"
						colorInterpolationFilters="sRGB"
					>
						<feFlood floodOpacity="0" result="BackgroundImageFix" />
						<feColorMatrix
							in="SourceAlpha"
							type="matrix"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
							result="hardAlpha"
						/>
						<feOffset dy="24" />
						<feGaussianBlur stdDeviation="16" />
						<feComposite in2="hardAlpha" operator="out" />
						<feColorMatrix
							type="matrix"
							values="0 0 0 0 0.0486111 0 0 0 0 0.127083 0 0 0 0 0.833333 0 0 0 0.06 0"
						/>
						<feBlend
							mode="normal"
							in2="BackgroundImageFix"
							result="effect1_dropShadow_1100_5433"
						/>
						<feBlend
							mode="normal"
							in="SourceGraphic"
							in2="effect1_dropShadow_1100_5433"
							result="shape"
						/>
					</filter>
					<filter
						id="filter1_d_1100_5433"
						x="0"
						y="0"
						width="130"
						height="130"
						filterUnits="userSpaceOnUse"
						colorInterpolationFilters="sRGB"
					>
						<feFlood floodOpacity="0" result="BackgroundImageFix" />
						<feColorMatrix
							in="SourceAlpha"
							type="matrix"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
							result="hardAlpha"
						/>
						<feOffset dy="24" />
						<feGaussianBlur stdDeviation="16" />
						<feComposite in2="hardAlpha" operator="out" />
						<feColorMatrix
							type="matrix"
							values="0 0 0 0 0.0486111 0 0 0 0 0.127083 0 0 0 0 0.833333 0 0 0 0.06 0"
						/>
						<feBlend
							mode="normal"
							in2="BackgroundImageFix"
							result="effect1_dropShadow_1100_5433"
						/>
						<feBlend
							mode="normal"
							in="SourceGraphic"
							in2="effect1_dropShadow_1100_5433"
							result="shape"
						/>
					</filter>
					<radialGradient
						id="paint0_radial_1100_5433"
						cx="0"
						cy="0"
						r="1"
						gradientUnits="userSpaceOnUse"
						gradientTransform="translate(65 18.6895) rotate(90) scale(55.3105)"
					>
						<stop stopColor="#F0F0FF" />
						<stop stopColor="#F1F1FD" />
						<stop offset="0.703125" stopColor="white" />
					</radialGradient>
					<linearGradient
						id="paint1_linear_1100_5433"
						x1="104.526"
						y1="74"
						x2="109.495"
						y2="52.1101"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#F7F8FD" />
						<stop offset="1" stopColor="white" />
					</linearGradient>
					<linearGradient
						id="paint2_linear_1100_5433"
						x1="58.4772"
						y1="29.3105"
						x2="88.0723"
						y2="53.1421"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#244CB3" stopOpacity="0.2" />
						<stop offset="1" stopColor="#B4C2E5" stopOpacity="0.07" />
					</linearGradient>
				</defs>
			</svg>
		</SvgIcon>
	);
};
