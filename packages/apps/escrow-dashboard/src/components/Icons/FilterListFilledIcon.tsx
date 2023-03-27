import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { FC } from 'react';

export const FilterListFilledIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon width="18" height="12" viewBox="0 0 18 12" fill="none" {...props}>
      <path d="M7 12H11V10H7V12ZM0 0V2H18V0H0ZM3 7H15V5H3V7Z" fill="#24046D" />
    </SvgIcon>
  );
};
