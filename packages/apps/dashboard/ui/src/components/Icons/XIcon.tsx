import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { FC } from 'react';

export const XIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon
      width="26"
      height="26"
      viewBox="0 0 300 300"
      fill="none"
      {...props}
    >
      <path
        d="M178.57 127.15L290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"
        fill="#858EC6"
      />
    </SvgIcon>
  );
};
