import { Box } from '@mui/material';
import { FC, PropsWithChildren } from 'react';

import { Footer } from '../Footer';
import { Header } from '../Header';

export const Layout: FC<PropsWithChildren<{}>> = ({ children }) => (
  <Box
    sx={{
      marginTop: '88px',
    }}
  >
    <Header />
    {children}
    <Footer />
  </Box>
);
