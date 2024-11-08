import Box from '@mui/material/Box';
import { FC, PropsWithChildren } from 'react';

export const PageWrapper: FC<PropsWithChildren<{}>> = ({ children }) => (
  <Box sx={{ px: { xs: 0, md: 3, lg: 5, xl: 7 } }}>
    <Box
      sx={{
        minHeight: 'calc(100vh - 180px)',
        background: '#f6f7fe',
        boxSizing: 'border-box',
        borderRadius: { xs: '0px', md: '24px' },
        padding: {
          xs: '36px 32px',
          lg: '60px 67px 69px',
          xl: '58px 104px 104px 104px',
        },
      }}
    >
      {children}
    </Box>
  </Box>
);
