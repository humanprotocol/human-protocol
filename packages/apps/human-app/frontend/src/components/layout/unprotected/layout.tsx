import { Grid } from '@mui/material';
import { Footer } from '../footer';
import { Navbar } from './navbar';

interface LayoutProps {
  children: React.ReactNode;
  withNavigation?: boolean;
  backgroundColor: string;
}

export function Layout({
  children,
  withNavigation = true,
  backgroundColor,
}: LayoutProps) {
  return (
    <Grid
      alignItems="center"
      container
      direction="column"
      justifyContent="space-between"
      sx={{
        height: '100vh',
        width: '100%',
        px: '44px',
        pb: '44px',
        pt: '0',
        backgroundColor,
      }}
    >
      <Navbar withNavigation={withNavigation} />
      {children}
      <Footer />
    </Grid>
  );
}
