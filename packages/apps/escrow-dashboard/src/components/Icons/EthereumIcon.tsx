import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { FC } from 'react';

export const EthereumIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon width="11" height="17" viewBox="0 0 11 17" fill="none" {...props}>
      <g opacity="0.6">
        <path
          d="M5.28544 6.28564L0 8.65912L5.28544 11.7424L10.5688 8.65912L5.28544 6.28564Z"
          fill="currentColor"
        />
      </g>
      <g opacity="0.45">
        <path d="M0 8.65899L5.28544 11.7422V0L0 8.65899Z" fill="currentColor" />
      </g>
      <g opacity="0.8">
        <path
          d="M5.28467 0V11.7422L10.568 8.65899L5.28467 0Z"
          fill="currentColor"
        />
      </g>
      <g opacity="0.45">
        <path
          d="M0 9.64795L5.28544 17.0002V12.7312L0 9.64795Z"
          fill="currentColor"
        />
      </g>
      <g opacity="0.8">
        <path
          d="M5.28467 12.7312V17.0002L10.5722 9.64795L5.28467 12.7312Z"
          fill="currentColor"
        />
      </g>
    </SvgIcon>
  );
};
