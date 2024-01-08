import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { FC } from 'react';

export const CollectionsFilledIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M22 16V4C22 2.9 21.1 2 20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16ZM11 12L13.03 14.71L16 11L20 16H8L11 12ZM2 6V20C2 21.1 2.9 22 4 22H18V20H4V6H2Z"
        fill="#24046D"
      />
    </SvgIcon>
  );
};
