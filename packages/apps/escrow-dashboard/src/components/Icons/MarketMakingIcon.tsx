import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { FC } from 'react';

export const MarketMakingIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
      <g clipPath="url(#clip0_569_45)">
        <path
          d="M21.3334 3L24.3867 6.05333L17.88 12.56L12.5467 7.22667L2.66669 17.12L4.54669 19L12.5467 11L17.88 16.3333L26.28 7.94667L29.3334 11V3H21.3334Z"
          fill="#24046D"
        />
        <mask
          id="mask0_569_45"
          maskUnits="userSpaceOnUse"
          x="4"
          y="11"
          width="25"
          height="23"
        >
          <path
            d="M4 21.5066V33.0533H29V13.72L26.28 11L17.88 19.3867L12.5467 14.0533L4.54669 22.0533L4 21.5066Z"
            fill="#D9D9D9"
          />
        </mask>
        <g mask="url(#mask0_569_45)">
          <path d="M6 6V29" stroke="#24046D" strokeWidth="2" />
          <path d="M11 6V29" stroke="#24046D" strokeWidth="2" />
          <path d="M16 6V29" stroke="#24046D" strokeWidth="2" />
          <path d="M21 6V29" stroke="#24046D" strokeWidth="2" />
          <path d="M26 6V29" stroke="#24046D" strokeWidth="2" />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_569_45">
          <rect width="32" height="32" fill="white" />
        </clipPath>
      </defs>
    </SvgIcon>
  );
};
