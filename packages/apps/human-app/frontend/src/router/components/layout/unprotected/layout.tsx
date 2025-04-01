import { Container, Grid } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { breakpoints } from '@/shared/styles/breakpoints';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useHomePageState } from '@/shared/contexts/homepage-state';
import { Footer } from '../../footer';
import { Navbar } from './navbar';

interface LayoutProps {
  withNavigation?: boolean;
}

export function UnprotectedLayout({
  withNavigation = true,
}: Readonly<LayoutProps>) {
  const { colorPalette, isDarkMode } = useColorMode();
  const { isMainPage } = useHomePageState();

  const isMobile = useIsMobile();
  const layoutBackgroundColor = (() => {
    if (isDarkMode || isMobile || isMainPage) {
      return colorPalette.backgroundColor;
    }

    return colorPalette.paper.main;
  })();

  return (
    <Grid
      alignItems="center"
      container
      direction="column"
      flexWrap="nowrap"
      sx={{
        height: '100%',
        minHeight: '100vh',
        width: '100%',
        pt: '0',
        px: isMobile ? 0 : '120px',
        backgroundColor: layoutBackgroundColor,
      }}
    >
      <Navbar withNavigation={withNavigation} />
      <Container
        component="main"
        maxWidth="xl"
        sx={{
          p: '0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          [breakpoints.mobile]: {
            pt: '32px',
          },
        }}
      >
        <Outlet />
      </Container>
      <Footer />
    </Grid>
  );
}
