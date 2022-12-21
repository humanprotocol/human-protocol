import * as React from 'react';
import { Box } from '@mui/material';
import Footer from 'src/components/Footer';
import Header from 'src/components/Header';

interface ILayout {
  children: React.ReactNode;
}

export const Layout: React.FC<ILayout> = ({ children }): React.ReactElement => (
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

export default Layout;
