import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { FC } from 'react';

export const CheckCircleFilledIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon
      width="24"
      height="24"
      viewBox="0 0 128 128"
      fill="none"
      {...props}
    >
      <path
        d="M63.9974 10.6666C34.5574 10.6666 10.6641 34.56 10.6641 64C10.6641 93.44 34.5574 117.333 63.9974 117.333C93.4374 117.333 117.331 93.44 117.331 64C117.331 34.56 93.4374 10.6666 63.9974 10.6666ZM53.3307 90.6666L26.6641 64L34.1841 56.48L53.3307 75.5733L93.8107 35.0933L101.331 42.6666L53.3307 90.6666Z"
        fill="#320A8D"
      />
    </SvgIcon>
  );
};
