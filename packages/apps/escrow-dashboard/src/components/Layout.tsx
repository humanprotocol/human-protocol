import * as React from 'react';
import { Box } from '@mui/material';
import Footer from './Footer';
import Header from './Header';

interface ILayout {
  children: React.ReactNode;
}

const Layout: React.FC<ILayout> = ({ children }): React.ReactElement => (
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
