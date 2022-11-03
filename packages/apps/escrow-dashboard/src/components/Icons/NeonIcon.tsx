import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import React from 'react';

export default function NeonIcon(props: SvgIconProps) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SvgIcon width="16" height="17" viewBox="0 0 16 17" fill="none" {...props}>
      <g clipPath="url(#clip0_1946_48319)">
        <path
          d="M12.5 15.4375H1.5V4.1875H7.5V3.1875H0.5V16.4375H13.5V9.4375H12.5V15.4375Z"
          fill="#FF2829"
        />
        <path
          d="M9.50001 1.4375V2.4375H13.7929L5.89648 10.334L6.60355 11.041L14.5 3.14459V7.4375H15.5V1.4375H9.50001Z"
          fill="#FF2829"
        />
      </g>
      <defs>
        <clipPath id="clip0_1946_48319">
          <rect
            width="16"
            height="16"
            fill="white"
            transform="translate(0 0.9375)"
          />
        </clipPath>
      </defs>
    </SvgIcon>
  );
}
