import { Container, Grid } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { colorPalette } from '@/styles/color-palette';
import { Footer } from '../footer';
import { Navbar } from './navbar';

interface LayoutProps {
  withNavigation?: boolean;
}

export function Layout({ withNavigation = true }: LayoutProps) {
  const { backgroundColor } = useBackgroundColorStore();
  const isMobile = useIsMobile();

  return (
    <Grid
      alignItems="center"
      container
      direction="column"
      flexWrap="nowrap"
      justifyContent="space-between"
      sx={{
        height: '100%',
        minHeight: '100vh',
        width: '100%',
        pt: '0',
        px: isMobile ? 0 : '120px',
        backgroundColor: isMobile ? colorPalette.white : backgroundColor,
      }}
    >
      <Navbar withNavigation={withNavigation} />
      <Container
        component="main"
        maxWidth="xl"
        sx={{ p: '0', display: 'flex', justifyContent: 'center' }}
      >
        <Outlet />
      </Container>
      <Footer />
    </Grid>
  );
}
