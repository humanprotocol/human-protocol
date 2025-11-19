import { Box } from '@mui/material';
import { FC, PropsWithChildren } from 'react';

import { Footer } from '../Footer';
import { Header } from '../Header';

type LayoutProps = PropsWithChildren<Record<string, never>>;

export const Layout: FC<LayoutProps> = ({ children }) => (
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
