import Box from '@mui/material/Box';
import React from 'react';

export const CardContainer = ({
  children,
  densed = false,
}: {
  children: React.ReactNode;
  densed?: boolean;
}) => {
  return (
    <Box
      sx={{
        background: '#fff',
        boxSizing: 'border-box',
        boxShadow:
          '0px 3px 1px -2px #E9EBFA, 0px 2px 2px rgba(233, 235, 250, 0.5), 0px 1px 5px rgba(233, 235, 250, 0.2)',
        borderRadius: { xs: '8px', xl: '16px' },
        padding: densed
          ? { xs: '10px 18px 12px', xl: '24px 42px 32px' }
          : { xs: '21px 24px 12px', xl: '54px 60px 32px' },
        height: '100%',
        position: 'relative',
      }}
    >
      {children}
    </Box>
  );
};
