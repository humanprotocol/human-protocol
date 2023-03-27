import Box from '@mui/material/Box';
import { FC, PropsWithChildren } from 'react';

export const PageWrapper: FC<PropsWithChildren<{}>> = ({ children }) => (
  <Box sx={{ px: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 } }}>
    <Box
      sx={{
        minHeight: 'calc(100vh - 180px)',
        background: '#f6f7fe',
        boxSizing: 'border-box',
        borderRadius: {
          xs: '16px',
          sm: '16px',
          md: '24px',
          lg: '32px',
          xl: '40px',
        },
        padding: {
          xs: '24px 16px',
          md: '42px 54px',
          lg: '56px 72px',
          xl: '70px 90px',
        },
      }}
    >
      {children}
    </Box>
  </Box>
);
