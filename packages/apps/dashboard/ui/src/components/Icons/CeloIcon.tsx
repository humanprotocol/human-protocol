import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';
import { FC } from 'react';

export const CeloIcon: FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon viewBox="0 0 49 49" {...props}>
      <path
        d="M49 0H0V49H48.999V31.8956H40.8672C38.0641 38.1354 31.7547 42.4813 24.5342 42.4813C14.58 42.4813 6.51872 34.3506 6.51872 24.4657C6.51872 14.581 14.58 6.5197 24.5342 6.5197C31.8947 6.5197 38.2041 11.0065 41.0083 17.3852H49V0Z"
        fill="#320A8D"
      />
    </SvgIcon>
  );
};
