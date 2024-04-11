import { Grid } from '@mui/material';
import type { ReactNode } from 'react';
import { Footer } from '../footer';
import { Drawer } from './drawer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Grid
      alignItems="center"
      container
      direction="column"
      justifyContent="space-between"
      sx={{ height: '100vh', width: '100%', px: '44px', pb: '44px', pt: '0' }}
    >
      <Drawer />
      {children}
      <Footer />
    </Grid>
  );
}
