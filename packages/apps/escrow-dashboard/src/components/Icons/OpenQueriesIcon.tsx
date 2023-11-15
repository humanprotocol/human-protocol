import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { FC } from 'react';

export const OpenQueriesIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
      <g clipPath="url(#clip0_569_553)">
        <path
          d="M29.1575 13.6666V13.6672L29.1653 27.7511L27.2071 25.7929L26.9142 25.5H26.5H13.6667C13.2106 25.5 12.8333 25.1227 12.8333 24.6666V13.6666C12.8333 13.2106 13.2106 12.8333 13.6667 12.8333H28.3333C28.7829 12.8333 29.1575 13.2041 29.1575 13.6666Z"
          stroke="#24046D"
          strokeWidth="2"
          fill="none"
        />
      </g>
      <g clipPath="url(#clip1_569_553)">
        <rect
          x="4.19048"
          y="4.14288"
          width="14.6667"
          height="11.5238"
          fill="#DFE3F1"
        />
        <path
          d="M1.8425 4.66665C1.8425 3.65831 2.65833 2.83331 3.66666 2.83331H18.3333C19.3417 2.83331 20.1667 3.65831 20.1667 4.66665V15.6666C20.1667 16.675 19.3417 17.5 18.3333 17.5H5.5L1.83333 21.1666L1.8425 4.66665ZM5.5 13.8333H16.5V12H5.5V13.8333ZM5.5 11.0833H16.5V9.24998H5.5V11.0833ZM5.5 8.33331H16.5V6.49998H5.5V8.33331Z"
          fill="#24046D"
        />
      </g>
      <defs>
        <clipPath id="clip0_569_553">
          <rect width="22" height="22" transform="translate(10 10)" />
        </clipPath>
        <clipPath id="clip1_569_553">
          <rect width="22" height="22" transform="matrix(-1 0 0 1 22 1)" />
        </clipPath>
      </defs>
    </SvgIcon>
  );
};
