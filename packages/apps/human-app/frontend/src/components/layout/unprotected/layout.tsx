import { Container, Grid } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { breakpoints } from '@/styles/theme';
import { Footer } from '../footer';
import { Navbar } from './navbar';

interface LayoutProps {
  withNavigation?: boolean;
}

export function Layout({ withNavigation = true }: LayoutProps) {
  return (
    <Grid
      alignItems="center"
      container
      direction="column"
      flexWrap="nowrap"
      justifyContent="space-between"
      sx={{
        height: '100vh',
        width: '100%',
        px: '44px',
        pb: '44px',
        pt: '0',
        [breakpoints.mobile]: {
          px: '10px',
        },
      }}
    >
      <Navbar withNavigation={withNavigation} />
      <Container component="main" sx={{ p: '0' }}>
        <Outlet />
      </Container>
      <Footer />
    </Grid>
  );
}
