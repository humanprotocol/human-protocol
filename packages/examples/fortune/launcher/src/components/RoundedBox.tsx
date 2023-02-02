import { Box as MuiBox, SxProps } from '@mui/material';
import React from 'react';

type BoxProps = {
  sx?: SxProps;
  children?: any;
};

export const RoundedBox = ({ children, sx = {} }: BoxProps) => {
  return (
    <MuiBox
      sx={{
        background: '#fff',
        boxShadow:
          '0px 3px 1px -2px #E9EBFA, 0px 2px 2px rgba(233, 235, 250, 0.5), 0px 1px 5px rgba(233, 235, 250, 0.2);',
        borderRadius: '16px',
        ...sx,
      }}
    >
      {children}
    </MuiBox>
  );
};
